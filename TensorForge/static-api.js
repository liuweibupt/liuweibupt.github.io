/* Static GitHub Pages adapter for the released TensorForge explorer data.
 * queryArray mirrors tools/area_power_explorer/query.py. No model is fitted or
 * extrapolated in the browser: prediction fallback uses the released CSV rows.
 */
(function (root) {
  'use strict';

  const defaults = {
    m: 1, n: 1, k: 16, clk_mhz: 1410, precision_name: 'BF16',
    mx: false, nv: false, norm_kind: 'FP32', acc_kind: 'FP32',
    out_kind: 'FP32', midmat: 26, allow_predicted: true,
  };
  const notFoundMessage = '该组合不存在，且没有可用估计值 / No exact or estimated data found';

  function candidatePrecisions(name, mx, nv) {
    const raw = String(name || '').trim();
    const base = raw.replace(/^(MXNV|MX|NV)/, '');
    const prefix = mx && nv ? 'MXNV' : mx ? 'MX' : nv ? 'NV' : '';
    return new Set([raw, prefix ? prefix + base : base, base].filter(Boolean));
  }

  // Python formats exact binary floating-point values with round-to-even. Using
  // toFixed directly changes formula text for exactly halfway values.
  function fixedSix(value) {
    if (!Number.isFinite(value)) return String(value).toLowerCase().replace('infinity', 'inf');
    const negative = value < 0 || Object.is(value, -0);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setFloat64(0, Math.abs(value));
    const high = view.getUint32(0);
    const low = view.getUint32(4);
    const exponentBits = (high >>> 20) & 0x7ff;
    let significand = (BigInt(high & 0xfffff) << 32n) | BigInt(low);
    if (exponentBits) significand |= 1n << 52n;
    const exponent = (exponentBits || 1) - 1023 - 52;
    let numerator = significand * 1000000n;
    let denominator = 1n;
    if (exponent >= 0) numerator <<= BigInt(exponent);
    else denominator <<= BigInt(-exponent);
    let rounded = numerator / denominator;
    const remainder = numerator % denominator;
    if (remainder * 2n > denominator ||
        (remainder * 2n === denominator && rounded % 2n === 1n)) rounded += 1n;
    const whole = rounded / 1000000n;
    const fraction = String(rounded % 1000000n).padStart(6, '0');
    return `${negative ? '-' : ''}${whole}.${fraction}`;
  }

  function formula(label, m, n, unitValue, totalValue, unit) {
    return `(${label} = ${m} × ${n} × ${fixedSix(unitValue)} ${unit} = ${fixedSix(totalValue)} ${unit})`;
  }

  function queryArray(data, params) {
    const p = Object.assign({}, defaults, params);
    const { m, n, k, clk_mhz, precision_name, mx, nv, norm_kind, acc_kind, out_kind, midmat, allow_predicted } = p;
    const tileCount = m * n;
    const requested = { m, n, k, clk_mhz, precision_name, mx, nv, norm_kind, acc_kind, out_kind, midmat };
    const candidates = candidatePrecisions(precision_name, mx, nv);
    // Measured rows are exported ORDER BY id. Python's IN clause treats all
    // candidate names equally, so the first row wins regardless of prefix.
    const matchesMeasured = (row) => candidates.has(row.precision_name) &&
      row.dim_k === k && row.clk_mhz != null && Math.abs(row.clk_mhz - clk_mhz) < 1e-6 &&
      row.mx_flag === Number(mx) && row.nv_flag === Number(nv) &&
      row.norm_kind === norm_kind && row.acc_kind === acc_kind &&
      row.out_kind === out_kind && row.midmat === midmat;
    const array = (data.array_measurements || []).find((row) =>
      row.dim_m === m && row.dim_n === n && matchesMeasured(row));
    let unitArea;
    let unitPower;
    let arrayArea;
    let arrayPower;
    let resultType;
    const exactMatchFound = Boolean(array);

    if (array) {
      arrayArea = Number(array.area_um2 || 0);
      arrayPower = Number(array.power_total_mw || 0);
      unitArea = tileCount ? arrayArea / tileCount : 0;
      unitPower = tileCount ? arrayPower / tileCount : 0;
      resultType = 'measured_array';
    } else {
      const measured = (data.dp_units || []).find(matchesMeasured);
      if (measured) {
        unitArea = Number(measured.area_um2 || 0);
        unitPower = Number(measured.power_total_mw || 0);
        resultType = 'derived_measured_unit';
      } else {
        const prediction = allow_predicted && (data.prediction_rows || []).find((row) => {
          const token = String(row.mx || '').trim();
          return candidates.has(String(row.ps_name || '').trim()) &&
            Math.trunc(Number(row.dimK || 0)) === k &&
            Math.abs(Number(row.clk_mhz || 0) - clk_mhz) < 1e-6 &&
            token.startsWith('withMX') === mx && token.endsWith('withNV') === nv &&
            String(row.norm_kind || '').trim() === norm_kind &&
            String(row.acc_kind || '').trim() === acc_kind &&
            String(row.out_kind || '').trim() === out_kind &&
            Math.trunc(Number(row.midMat || 0)) === midmat;
        });
        if (!prediction) {
          return {
            status: 'not_found', result_type: 'not_found', exact_match_found: false,
            estimate_available: false, message: notFoundMessage, tile_count: tileCount,
            actual_k: k, requested, allow_predicted,
          };
        }
        unitArea = Number(prediction.area_pred);
        unitPower = Number(prediction.power_pred);
        resultType = 'predicted_unit';
      }
      arrayArea = tileCount * unitArea;
      arrayPower = tileCount * unitPower;
    }

    const opsPerCycle = 2 * m * n * k;
    return {
      status: exactMatchFound ? 'exact' : 'estimated_only', result_type: resultType,
      exact_match_found: exactMatchFound, estimate_available: true,
      message: exactMatchFound ? '精确结果存在 / Exact measured result found' :
        '精确组合不存在，以下为估计值 / Exact match not found; showing estimate',
      tile_count: tileCount, actual_k: k, unit_area_um2: unitArea,
      unit_power_total_mw: unitPower, array_area_um2: arrayArea,
      array_power_total_mw: arrayPower, macs_per_cycle: m * n * k,
      ops_per_cycle: opsPerCycle, throughput_ops_per_sec: opsPerCycle * clk_mhz * 1000000,
      formula_area: formula('Array Area', m, n, unitArea, arrayArea, 'um²'),
      formula_power: formula('Array Power', m, n, unitPower, arrayPower, 'mW'),
      requested, allow_predicted,
    };
  }

  function queryParams(searchParams) {
    // parse_qs discards blank values and uses the first nonblank duplicate.
    const first = (key, fallback) => searchParams.getAll(key).find((value) => value !== '') ?? fallback;
    const integer = (key, fallback) => {
      const raw = first(key, String(fallback));
      if (!/^[+-]?\d(?:_?\d)*$/.test(raw.trim())) {
        throw new Error(`invalid literal for int() with base 10: '${raw}'`);
      }
      return Number(raw.replaceAll('_', ''));
    };
    const floating = (key, fallback) => {
      const raw = first(key, String(fallback));
      const cleaned = raw.trim();
      if (/^[+-]?(inf(inity)?|nan)$/i.test(cleaned)) {
        if (/nan/i.test(cleaned)) return NaN;
        return cleaned.startsWith('-') ? -Infinity : Infinity;
      }
      if (!/^[+-]?(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?$/.test(cleaned)) {
        throw new Error(`could not convert string to float: '${raw}'`);
      }
      return Number(cleaned.replaceAll('_', ''));
    };
    const boolean = (key, fallback) => ['1', 'true', 'True'].includes(first(key, fallback ? '1' : '0'));
    return {
      m: integer('m', 1), n: integer('n', 1), k: integer('k', 16),
      clk_mhz: floating('clk_mhz', 1410), precision_name: first('precision_name', 'BF16'),
      mx: boolean('mx', false), nv: boolean('nv', false),
      norm_kind: first('norm_kind', 'FP32'), acc_kind: first('acc_kind', 'FP32'),
      out_kind: first('out_kind', 'FP32'), midmat: integer('midmat', 26),
      allow_predicted: boolean('allow_predicted', true),
    };
  }

  // Capture the script directory during execution so every page and any Pages
  // base path fetch /TensorForge/data/, never the personal site's root /data/.
  const scriptUrl = root.document && root.document.currentScript && root.document.currentScript.src;
  const projectBase = root.document ? new URL('.', scriptUrl || root.document.baseURI) : null;
  const resources = {
    '/api/meta': 'meta.json', '/api/options': 'options.json',
    '/api/ppa-data': 'ppa-data.json', '/api/baseline-data': 'baseline-data.json',
    '/api/breakdown-data': 'breakdown-data.json',
  };
  const cache = new Map();

  function loadJson(filename) {
    const url = new URL(`data/${filename}`, projectBase).href;
    if (!cache.has(url)) {
      const promise = root.fetch(url).then((response) => {
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        return response.json();
      }).catch((error) => {
        cache.delete(url);
        throw error;
      });
      cache.set(url, promise);
    }
    return cache.get(url);
  }

  function fetchJson(url) {
    const parsed = new URL(url, projectBase);
    if (parsed.pathname === '/api/query') {
      let params;
      try { params = queryParams(parsed.searchParams); }
      catch (error) { return Promise.reject(error); }
      return loadJson('query-data.json').then((data) => queryArray(data, params));
    }
    const filename = resources[parsed.pathname];
    if (!filename) return Promise.reject(new Error(`Unknown explorer endpoint: ${parsed.pathname}`));
    return loadJson(filename);
  }

  const api = { fetchJson, queryArray };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TensorForgeAPI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
