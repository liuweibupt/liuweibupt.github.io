'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { queryArray } = require('../TensorForge/static-api.js');

const params = {
  m: 2, n: 3, k: 16, clk_mhz: 1410, precision_name: 'BF16',
  mx: false, nv: false, norm_kind: 'FP32', acc_kind: 'FP32',
  out_kind: 'FP32', midmat: 26, allow_predicted: true,
};
const measuredUnit = {
  id: 1, precision_name: 'BF16', dim_k: 16, clk_mhz: 1410,
  mx_flag: 0, nv_flag: 0, norm_kind: 'FP32', acc_kind: 'FP32',
  out_kind: 'FP32', midmat: 26, area_um2: 1.25, power_total_mw: 0.5,
};
const predictionRow = {
  ps_name: 'BF16', dimK: '16', clk_mhz: '1410', mx: 'noMX_noNV',
  norm_kind: 'FP32', acc_kind: 'FP32', out_kind: 'FP32', midMat: '26',
  area_pred: '2.5', power_pred: '0.25',
};
const empty = { dp_units: [], array_measurements: [], prediction_rows: [] };

test('exact arrays take precedence over units and released predictions', () => {
  const result = queryArray({
    dp_units: [measuredUnit], prediction_rows: [predictionRow],
    array_measurements: [{ ...measuredUnit, dim_m: 2, dim_n: 3, area_um2: 60, power_total_mw: 12 }],
  }, params);
  assert.equal(result.status, 'exact');
  assert.equal(result.result_type, 'measured_array');
  assert.equal(result.unit_area_um2, 10);
  assert.equal(result.array_area_um2, 60);
  assert.equal(result.unit_power_total_mw, 2);
  assert.equal(result.exact_match_found, true);
  assert.equal(result.estimate_available, true);
});

test('measured unit derivation preserves dimensions, throughput and formulas', () => {
  const result = queryArray({ ...empty, dp_units: [measuredUnit], prediction_rows: [predictionRow] }, params);
  assert.equal(result.status, 'estimated_only');
  assert.equal(result.result_type, 'derived_measured_unit');
  assert.equal(result.tile_count, 6);
  assert.equal(result.actual_k, 16);
  assert.equal(result.array_area_um2, 7.5);
  assert.equal(result.array_power_total_mw, 3);
  assert.equal(result.macs_per_cycle, 96);
  assert.equal(result.ops_per_cycle, 192);
  assert.equal(result.throughput_ops_per_sec, 270720000000);
  assert.equal(result.formula_area, '(Array Area = 2 × 3 × 1.250000 um² = 7.500000 um²)');
  assert.equal(result.formula_power, '(Array Power = 2 × 3 × 0.500000 mW = 3.000000 mW)');
  const { allow_predicted, ...requested } = params;
  assert.deepEqual(result.requested, requested);
  assert.equal(result.allow_predicted, allow_predicted);
});

test('precision candidates preserve first id precedence across prefixed and base names', () => {
  const data = { ...empty, dp_units: [
    { ...measuredUnit, mx_flag: 1, area_um2: 8 },
    { ...measuredUnit, id: 2, precision_name: 'MXBF16', mx_flag: 1, area_um2: 12 },
  ] };
  for (const precision_name of ['BF16', 'MXBF16', 'NVBF16', 'MXNVBF16']) {
    assert.equal(queryArray(data, { ...params, mx: true, precision_name }).unit_area_um2, 8);
  }
});

test('clock tolerance is strict and measured null clocks never match', () => {
  const data = { ...empty, dp_units: [measuredUnit] };
  assert.equal(queryArray(data, { ...params, clk_mhz: 1410 + 0.5e-6 }).result_type, 'derived_measured_unit');
  assert.equal(queryArray(data, { ...params, clk_mhz: 1410 + 2e-6 }).status, 'not_found');
  assert.equal(queryArray({ ...empty, dp_units: [{ ...measuredUnit, clk_mhz: null }] },
    { ...params, clk_mhz: 0 }).status, 'not_found');
});

test('prediction fallback matches every configuration field and CSV token flags', () => {
  const data = { ...empty, prediction_rows: [
    { ...predictionRow, mx: 'withMX_withNV', ps_name: 'MXNVBF16', area_pred: '7.5' },
    { ...predictionRow, mx: 'withMX_withNV', area_pred: '9' },
  ] };
  const predictedParams = { ...params, mx: true, nv: true };
  assert.equal(queryArray(data, predictedParams).result_type, 'predicted_unit');
  assert.equal(queryArray(data, predictedParams).unit_area_um2, 7.5);
  for (const changed of [
    { k: 32 }, { clk_mhz: 1400 }, { precision_name: 'FP8' }, { mx: false },
    { nv: false }, { norm_kind: 'FP16' }, { acc_kind: 'FP16' },
    { out_kind: 'FP16' }, { midmat: 27 }, { allow_predicted: false },
  ]) {
    assert.equal(queryArray(data, { ...predictedParams, ...changed }).status, 'not_found', JSON.stringify(changed));
  }
});

test('missing results contain the original status, message and no fabricated metrics', () => {
  assert.deepEqual(queryArray(empty, params), {
    status: 'not_found', result_type: 'not_found', exact_match_found: false,
    estimate_available: false,
    message: '该组合不存在，且没有可用估计值 / No exact or estimated data found',
    tile_count: 6, actual_k: 16,
    requested: Object.fromEntries(Object.entries(params).filter(([key]) => key !== 'allow_predicted')),
    allow_predicted: true,
  });
});

test('null measured values become zero and a zero-tile exact array remains exact', () => {
  const data = { ...empty, array_measurements: [
    { ...measuredUnit, dim_m: 0, dim_n: 3, area_um2: null, power_total_mw: 9 },
  ] };
  const result = queryArray(data, { ...params, m: 0 });
  assert.equal(result.status, 'exact');
  assert.equal(result.tile_count, 0);
  assert.equal(result.unit_area_um2, 0);
  assert.equal(result.unit_power_total_mw, 0);
  assert.equal(result.array_power_total_mw, 9);
});

test('formulas match Python half-even rounding for exact binary ties', () => {
  const result = queryArray({ ...empty, dp_units: [
    { ...measuredUnit, area_um2: 0.0078125, power_total_mw: 0.0234375 },
  ] }, { ...params, m: 1, n: 1 });
  assert.equal(result.formula_area, '(Array Area = 1 × 1 × 0.007812 um² = 0.007812 um²)');
  assert.equal(result.formula_power, '(Array Power = 1 × 1 × 0.023438 mW = 0.023438 mW)');
});

function browserAPI(fetch) {
  const context = {
    URL, fetch,
    document: {
      currentScript: { src: 'https://example.github.io/personal/TensorForge/static-api.js' },
      baseURI: 'https://example.github.io/personal/TensorForge/charts/ppa.html',
    },
  };
  vm.runInNewContext(readFileSync(path.join(__dirname, '../TensorForge/static-api.js'), 'utf8'), context);
  return context.TensorForgeAPI;
}

test('API resources use the script project directory and cache concurrent JSON loads', async () => {
  const urls = [];
  const api = browserAPI(async (url) => {
    urls.push(url);
    return { ok: true, json: async () => ({ loaded: true }) };
  });
  const options = api.fetchJson('/api/options');
  assert.equal(api.fetchJson('/api/options'), options);
  await Promise.all([options, api.fetchJson('/api/meta'), api.fetchJson('/api/ppa-data'),
    api.fetchJson('/api/baseline-data'), api.fetchJson('/api/breakdown-data')]);
  assert.deepEqual(urls, ['options', 'meta', 'ppa-data', 'baseline-data', 'breakdown-data']
    .map((name) => `https://example.github.io/personal/TensorForge/data/${name}.json`));
});

test('query URLs reproduce server defaults, first nonblank parameters and boolean parsing', async () => {
  let loads = 0;
  const api = browserAPI(async (url) => {
    assert.equal(url, 'https://example.github.io/personal/TensorForge/data/query-data.json');
    loads += 1;
    return { ok: true, json: async () => empty };
  });
  const defaultResult = await api.fetchJson('/api/query');
  assert.deepEqual(JSON.parse(JSON.stringify(defaultResult)), queryArray(empty, {}));
  const result = await api.fetchJson('/api/query?m=&m=2&m=7&n=3&mx=True&nv=TRUE&allow_predicted=false');
  assert.equal(result.requested.m, 2);
  assert.equal(result.requested.n, 3);
  assert.equal(result.requested.mx, true);
  assert.equal(result.requested.nv, false);
  assert.equal(result.allow_predicted, false);
  assert.equal(loads, 1);
});

test('invalid query parameters reject before loading data', async () => {
  const api = browserAPI(async () => { throw new Error('must not fetch'); });
  await assert.rejects(api.fetchJson('/api/query?m=1.5'), /invalid literal for int/);
  await assert.rejects(api.fetchJson('/api/query?clk_mhz=0x10'), /could not convert string to float/);
  await assert.rejects(api.fetchJson('/api/query?clk_mhz=1__2'), /could not convert string to float/);
  await assert.rejects(api.fetchJson('/api/unknown'), /Unknown explorer endpoint/);
});

test('failed JSON loads can be retried', async () => {
  let attempts = 0;
  const api = browserAPI(async () => {
    attempts += 1;
    return { ok: attempts > 1, status: 503, json: async () => ({ recovered: true }) };
  });
  await assert.rejects(api.fetchJson('/api/options'), /Request failed: 503/);
  assert.equal((await api.fetchJson('/api/options')).recovered, true);
  assert.equal(attempts, 2);
});
