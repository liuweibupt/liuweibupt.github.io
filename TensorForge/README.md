# TensorForge on GitHub Pages

The explorer is published at **https://liuweibupt.github.io/TensorForge/**.
Its four views come from [liuweibupt/TensorForge](https://github.com/liuweibupt/TensorForge),
with project-relative links and a browser implementation of the original query API.
It works as static files alongside the existing Jekyll personal site.

## Data and query behavior

- The export rebuilds the database from the released clock-gated synthesis CSV and baseline CSV, using the upstream normalizer. It does not reuse a potentially stale SQLite database.
- Query precedence is unchanged: exact synthesized array, scaled synthesized dot-product unit, released predicted unit (when allowed), then no result.
- The prediction fallback looks up the original prediction CSV. It does not retrain a model or extrapolate to unseen configurations. In the current release, all prediction rows also have synthesized unit measurements, which take precedence.
- Area and power formulas, clock tolerance, precision/MX/NV matching, and result classifications follow the Python implementation. “Measured” means synthesis-backed here, not silicon measurements.
- `data/provenance.json` records the source commit, input hashes, and record counts. The full clock-gated CSV and the released two-stage model metrics/formula are also downloadable from `data/`.

## Refresh from upstream

With a local clone of TensorForge:

```bash
python3 tools/export_tensorforge.py --source /path/to/TensorForge
node --test tests/tensorforge-query.test.js
python3 tools/verify_tensorforge.py --source /path/to/TensorForge
```

Run these commands from the personal-site repository root. The exporter uses Python's
standard library and the upstream Python modules; no model-training environment is required.
It updates only the data files, preserving GitHub Pages adaptations to the frontend.
If upstream changes the query semantics or page structure, review those changes before refreshing.

## Local preview

```bash
python3 -m http.server 8000
```

Open http://localhost:8000/TensorForge/ to preview the standalone explorer. For the
whole personal site, use the Jekyll instructions in the root README. Keep Jekyll
enabled for the personal site; the explorer HTML has no front matter and is copied
without the personal-site layout.
