function fetchJson(url) {
  return window.TensorForgeAPI.fetchJson(url);
}

function setSelectOptions(select, values, defaultValue, formatter = (value) => ({ value: String(value), label: String(value) })) {
  const normalized = values && values.length ? values : [defaultValue];
  select.replaceChildren(...normalized.map((value) => {
    const item = formatter(value);
    return new Option(item.label, item.value);
  }));
  select.value = normalized.map(String).includes(String(defaultValue)) ? String(defaultValue) : String(normalized[0]);
}

const resultTypes = {
  measured_array: 'Measured Array',
  derived_measured_unit: 'Derived from Measured Unit',
  predicted_unit: 'Predicted Unit',
};

function resultCard(label, value, className = '') {
  const card = document.createElement('article');
  card.className = `card ${className}`;
  const heading = document.createElement('div');
  heading.className = 'label';
  heading.textContent = label;
  const content = document.createElement('div');
  content.className = 'value';
  content.textContent = value;
  card.append(heading, content);
  return card;
}

function setBusy(busy) {
  document.querySelector('.metrics').setAttribute('aria-busy', String(busy));
  for (const element of document.getElementById('query-form').elements) {
    element.disabled = busy;
  }
}

function renderCards(result) {
  const cards = document.getElementById('result-cards');
  if (result.status === 'not_found') {
    cards.replaceChildren(resultCard('Query Status', result.message, 'error-card'));
    document.getElementById('result-formulas').textContent = 'No exact or estimated result available. Try another configuration or enable prediction fallback.';
    return;
  }

  const rows = [
    ['Query Status', result.message],
    ['Result Type', resultTypes[result.result_type] || result.result_type, `source-${result.result_type}`],
    ['Tile Count (M × N)', String(result.tile_count)],
    ['Unit Area', `${result.unit_area_um2.toFixed(6)} µm²`],
    ['Unit Power', `${result.unit_power_total_mw.toFixed(6)} mW`],
    ['Array Area', `${result.array_area_um2.toFixed(6)} µm²`],
    ['Array Power', `${result.array_power_total_mw.toFixed(6)} mW`],
  ];
  cards.replaceChildren(...rows.map((row) => resultCard(...row)));
  document.getElementById('result-formulas').textContent = `${result.formula_area}\n${result.formula_power}\nOperations per cycle = 2 × M × N × K = ${result.ops_per_cycle}`;
}

function renderError(error) {
  document.getElementById('result-cards').replaceChildren(resultCard('Failed to load result', error.message || String(error), 'error-card'));
  document.getElementById('result-formulas').textContent = 'Reload this page to retry loading the released dataset.';
}

async function loadOptions() {
  const options = await fetchJson('/api/options');
  setSelectOptions(document.getElementById('dim-m'), options.dim_m, 8);
  setSelectOptions(document.getElementById('dim-n'), options.dim_n, 4);
  setSelectOptions(document.getElementById('dim-k'), options.dim_k, 16);
  setSelectOptions(document.getElementById('clk-mhz'), options.clk_mhz, 1410);
  setSelectOptions(document.getElementById('precision-name'), options.precision_name, 'BF16');
  setSelectOptions(document.getElementById('norm-kind'), options.norm_kind, 'FP32');
  setSelectOptions(document.getElementById('acc-kind'), options.acc_kind, 'FP32');
  setSelectOptions(document.getElementById('out-kind'), options.out_kind, 'FP32');
  setSelectOptions(document.getElementById('midmat-select'), options.midmat, 26);
  setSelectOptions(document.getElementById('mx-select'), options.mx, 0, (value) => ({ value: String(value), label: value ? 'With MX' : 'No MX' }));
  setSelectOptions(document.getElementById('nv-select'), options.nv, 0, (value) => ({ value: String(value), label: value ? 'With NV' : 'No NV' }));
  setSelectOptions(document.getElementById('allow-predicted'), options.allow_predicted, 1, (value) => ({ value: String(value), label: value ? 'Allow Predicted' : 'Measured / Derived Only' }));
}

async function submitQuery(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const params = new URLSearchParams();
  for (const element of form.elements) {
    if (element.name) params.set(element.name, element.value);
  }
  setBusy(true);
  document.getElementById('result-cards').replaceChildren(resultCard('Query Status', 'Loading result…'));
  document.getElementById('result-formulas').textContent = '';
  try {
    renderCards(await fetchJson(`/api/query?${params.toString()}`));
  } catch (error) {
    renderError(error);
  } finally {
    setBusy(false);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('query-form');
  form.addEventListener('submit', submitQuery);
  setBusy(true);
  try {
    await loadOptions();
    await submitQuery({ preventDefault() {}, currentTarget: form });
  } catch (error) {
    renderError(error);
    // Keep unavailable controls disabled until a successful reload.
    document.querySelector('.metrics').setAttribute('aria-busy', 'false');
  }
});
