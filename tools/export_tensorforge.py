#!/usr/bin/env python3
"""Export the upstream TensorForge Python APIs for a static GitHub Pages site."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import shutil
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parents[1]


def write_json(path: Path, payload: object) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + "\n",
        encoding="utf-8",
    )


def export(source: Path, output: Path) -> dict:
    source = source.resolve()
    bundle = source / "tensorforge_site_bundle"
    if not (bundle / "tools/area_power_explorer/server.py").is_file():
        raise ValueError(f"TensorForge site bundle not found in {source}")

    # Use the upstream normalizer and API serializers instead of duplicating them.
    sys.path.insert(0, str(bundle))
    from tools.area_power_explorer.build_db import build_database
    from tools.area_power_explorer.server import (
        _api_baseline_data,
        _api_breakdown_data,
        _api_ppa_data,
        _db_counts,
        _db_options,
    )

    output.mkdir(parents=True, exist_ok=True)
    predictions = bundle / "artifacts/area_power_explorer/models/dp_two_stage_predictions_reuse_by_clk.csv"
    with tempfile.TemporaryDirectory(prefix="tensorforge-export-") as temporary:
        # Always rebuild from the released clock-gated CSV, avoiding stale SQLite artifacts.
        database = build_database(Path(temporary) / "area_power.db")
        with sqlite3.connect(database) as connection:
            connection.row_factory = sqlite3.Row
            query_data = {
                table: [dict(row) for row in connection.execute(f"SELECT * FROM {table} ORDER BY id")]
                for table in ("dp_units", "array_measurements")
            }
        with predictions.open(encoding="utf-8-sig", newline="") as handle:
            query_data["prediction_rows"] = list(csv.DictReader(handle))

        counts = _db_counts(database)
        for name, payload in {
            "meta": {"counts": counts},
            "options": _db_options(database),
            "ppa-data": _api_ppa_data(database),
            "baseline-data": _api_baseline_data(),
            "breakdown-data": _api_breakdown_data(),
            "query-data": query_data,
        }.items():
            write_json(output / f"{name}.json", payload)

    downloads = {
        "clock_gated_area_power_measurements.csv": bundle / "data/clock_gated_area_power_measurements.csv",
        "model-metrics.json": bundle / "artifacts/area_power_explorer/models/dp_two_stage_metrics_reuse_by_clk.json",
        "model-formula.txt": bundle / "artifacts/area_power_explorer/models/dp_two_stage_formula_reuse_by_clk.txt",
    }
    for filename, path in downloads.items():
        shutil.copyfile(path, output / filename)

    tracked_inputs = [
        bundle / "data/clock_gated_area_power_measurements.csv",
        bundle / "data/baseline_comparison.csv",
        bundle / "data/ventus_sm_top_area.csv",
        bundle / "data/ventus_top_module_area_sum_rolled.csv",
        predictions,
        *sorted((bundle / "tools/area_power_explorer").glob("*.py")),
        bundle / "tools/area_power_explorer/schema.sql",
        downloads["model-metrics.json"],
        downloads["model-formula.txt"],
    ]
    with downloads["clock_gated_area_power_measurements.csv"].open(encoding="utf-8-sig", newline="") as handle:
        measurement_count = sum(1 for _ in csv.DictReader(handle))
    provenance = {
        "source_repository": "https://github.com/liuweibupt/TensorForge",
        "source_commit": subprocess.check_output(["git", "-C", str(source), "rev-parse", "HEAD"], text=True).strip(),
        "source_commit_date": subprocess.check_output(["git", "-C", str(source), "show", "-s", "--format=%cI", "HEAD"], text=True).strip(),
        "measurement_source": "tensorforge_site_bundle/data/clock_gated_area_power_measurements.csv",
        "measurement_count": measurement_count,
        "counts": counts,
        "prediction_row_count": len(query_data["prediction_rows"]),
        "query_precedence": ["measured_array", "derived_measured_unit", "predicted_unit", "not_found"],
        "prediction_scope": "Exact lookup of the released prediction CSV; no browser model fitting or extrapolation.",
        "input_sha256": {
            path.relative_to(source).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
            for path in tracked_inputs
        },
    }
    write_json(output / "provenance.json", provenance)
    return provenance


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path, help="Local clone of liuweibupt/TensorForge")
    parser.add_argument("--output", type=Path, default=SITE_ROOT / "TensorForge/data")
    args = parser.parse_args()
    provenance = export(args.source, args.output)
    print(f"Exported {provenance['measurement_count']} clock-gated measurements from {provenance['source_commit']}")
    print(json.dumps(provenance["counts"]))


if __name__ == "__main__":
    main()
