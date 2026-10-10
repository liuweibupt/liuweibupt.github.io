#!/usr/bin/env python3
"""Compare browser query results against the original TensorForge Python engine."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    args = parser.parse_args()
    bundle = args.source.resolve() / "tensorforge_site_bundle"
    sys.path.insert(0, str(bundle))
    from tools.area_power_explorer.build_db import build_database
    from tools.area_power_explorer.query import ExplorerQueryEngine

    query_data = SITE_ROOT / "TensorForge/data/query-data.json"
    data = json.loads(query_data.read_text(encoding="utf-8"))
    requests = []

    def from_row(row: dict, m: int, n: int) -> dict:
        return {
            "m": m, "n": n, "k": row["dim_k"], "clk_mhz": row["clk_mhz"],
            "precision_name": row["precision_name"], "mx": bool(row["mx_flag"]),
            "nv": bool(row["nv_flag"]), "norm_kind": row["norm_kind"],
            "acc_kind": row["acc_kind"], "out_kind": row["out_kind"],
            "midmat": row["midmat"], "allow_predicted": True,
        }

    for row in data["array_measurements"]:
        requests.append(from_row(row, row["dim_m"], row["dim_n"]))
    for row in data["dp_units"]:
        requests.append(from_row(row, 3, 5))
        # The UI removes MX/NV prefixes; test the same selection via its base name.
        request = from_row(row, 8, 4)
        for prefix in ("MXNV", "MX", "NV"):
            if request["precision_name"].startswith(prefix):
                request["precision_name"] = request["precision_name"][len(prefix):]
                break
        requests.append(request)

    default = {
        "m": 8, "n": 4, "k": 16, "clk_mhz": 1410.0, "precision_name": "BF16",
        "mx": False, "nv": False, "norm_kind": "FP32", "acc_kind": "FP32",
        "out_kind": "FP32", "midmat": 26, "allow_predicted": True,
    }
    requests.extend([
        default,
        {**default, "m": 3, "n": 5, "allow_predicted": False},
        {**default, "precision_name": "unreleased"},
        {**default, "precision_name": "unreleased", "allow_predicted": False},
        {**default, "mx": True, "norm_kind": "FP16", "acc_kind": "INT32", "out_kind": "INT32", "midmat": 0},
        {**default, "clk_mhz": 1410.0000005},
        {**default, "clk_mhz": 1410.000002},
        {**default, "m": 0},
    ])

    with tempfile.TemporaryDirectory(prefix="tensorforge-parity-") as temporary:
        directory = Path(temporary)
        database = build_database(directory / "area_power.db")
        (directory / "models").mkdir()
        shutil.copyfile(
            bundle / "artifacts/area_power_explorer/models/dp_two_stage_predictions_reuse_by_clk.csv",
            directory / "models/dp_two_stage_predictions_reuse_by_clk.csv",
        )
        engine = ExplorerQueryEngine(database)
        cases = [{"params": request, "expected": engine.query_array(**request)} for request in requests]
        # Predictions overlap measured units in this release. Remove measurements
        # in a temporary fixture to exercise every released fallback row without
        # changing the published data or its scientific behavior.
        with engine._connect() as connection:
            connection.execute("DELETE FROM dp_units")
            connection.execute("DELETE FROM array_measurements")
        prediction_cases = []
        for row in data["prediction_rows"]:
            mx, nv = engine._mx_nv_from_token(row["mx"])
            request = {
                "m": 3, "n": 5, "k": int(float(row["dimK"])), "clk_mhz": float(row["clk_mhz"]),
                "precision_name": row["ps_name"], "mx": mx, "nv": nv,
                "norm_kind": row["norm_kind"], "acc_kind": row["acc_kind"],
                "out_kind": row["out_kind"], "midmat": int(float(row["midMat"])),
                "allow_predicted": True,
            }
            prediction_cases.append({"params": request, "expected": engine.query_array(**request)})

        fixture = directory / "cases.json"
        fixture.write_text(json.dumps({"cases": cases, "prediction_cases": prediction_cases}), encoding="utf-8")
        # Numeric comparisons tolerate machine rounding only; strings/formulas and
        # provenance classification must match exactly.
        script = r"""
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {queryArray} = require(process.argv[1]);
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const fixtures = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
function compare(actual, expected, path = '') {
  if (typeof expected === 'number') {
    assert.equal(typeof actual, 'number', path);
    assert.ok(Math.abs(actual - expected) <= Math.max(1, Math.abs(expected)) * 1e-12,
      `${path}: ${actual} != ${expected}`);
  } else if (expected && typeof expected === 'object') {
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), path);
    for (const key of Object.keys(expected)) compare(actual[key], expected[key], `${path}.${key}`);
  } else assert.equal(actual, expected, path);
}
for (const [index, fixture] of fixtures.cases.entries()) {
  compare(queryArray(data, fixture.params), fixture.expected, `measured[${index}]`);
}
const predictions = {...data, dp_units: [], array_measurements: []};
for (const [index, fixture] of fixtures.prediction_cases.entries()) {
  compare(queryArray(predictions, fixture.params), fixture.expected, `prediction[${index}]`);
}
console.log(`Python/JavaScript parity passed: ${fixtures.cases.length} measured/missing cases + ${fixtures.prediction_cases.length} prediction cases.`);
"""
        subprocess.run([
            "node", "-e", script, str(SITE_ROOT / "TensorForge/static-api.js"),
            str(query_data), str(fixture),
        ], check=True)
        counts = Counter(case["expected"]["result_type"] for case in cases + prediction_cases)
        print(json.dumps(counts, sort_keys=True))


if __name__ == "__main__":
    main()
