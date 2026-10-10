function fetchChartJson(url) {
  return window.TensorForgeAPI.fetchJson(url);
}

function inspectOnInteraction(element, detail, description) {
  element.setAttribute('tabindex', '0');
  element.setAttribute('aria-label', description);
  const title = svgEl('title');
  title.textContent = description;
  element.appendChild(title);
  const inspect = () => { detail.textContent = description; };
  for (const event of ['mouseenter', 'focus', 'click']) element.addEventListener(event, inspect);
}

function setChartControlsBusy(formIds, busy) {
  for (const id of formIds) {
    document.getElementById(id).querySelectorAll('select').forEach((select) => { select.disabled = busy; });
  }
}

function tickLabel(value) {
  return value.toLocaleString('en-US', { maximumFractionDigits: value < 10 ? 2 : 0 });
}

function setOptions(select, values, defaultValue, labeler = (v) => ({ value: String(v), label: String(v) })) {
  const normalized = values && values.length ? values : [defaultValue];
  select.innerHTML = normalized.map((value) => {
    const item = labeler(value);
    return `<option value="${item.value}">${item.label}</option>`;
  }).join('');
  select.value = normalized.map(String).includes(String(defaultValue)) ? String(defaultValue) : String(normalized[0]);
}

function svgClear(svg) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}

function svgEl(name, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  return el;
}

function colorForIndex(index) {
  const palette = ['#2364d2', '#1d9a8a', '#e68a00', '#a855f7', '#d946ef', '#ef4444', '#14b8a6', '#64748b'];
  return palette[index % palette.length];
}

function initPPA() {
  const unitSvg = document.getElementById('ppa-unit-chart');
  const arraySvg = document.getElementById('ppa-array-chart');
  if (!unitSvg || !arraySvg) return;
  const unitDetail = document.getElementById('ppa-unit-detail');
  const arrayDetail = document.getElementById('ppa-array-detail');
  const unitClkSelect = document.getElementById('ppa-unit-clk');
  const unitPrecisionSelect = document.getElementById('ppa-unit-precision');
  const arrayClkSelect = document.getElementById('ppa-array-clk');
  const arrayPrecisionSelect = document.getElementById('ppa-array-precision');

  setChartControlsBusy(['ppa-unit-filter-form', 'ppa-array-filter-form'], true);
  fetchChartJson('/api/ppa-data').then((payload) => {
    const unitPoints = payload.series.find((series) => series.name === 'Dot Product Units')?.points || [];
    const arrayPoints = payload.series.find((series) => series.name === 'Measured Arrays')?.points || [];

    const renderScatter = ({ svg, detail, points, clkSelect, precisionSelect, kind }) => {
      svgClear(svg);
      const selectedPoints = points.filter((point) => {
        const clkOk = clkSelect.value === 'all' || String(point.clk_mhz) === String(clkSelect.value);
        const precOk = precisionSelect.value === 'all' || point.precision_name === precisionSelect.value;
        return clkOk && precOk;
      });
      if (!selectedPoints.length) {
        detail.textContent = `(No ${kind} points match the current filters.)`;
        return;
      }
      const backgroundPoints = points.filter((point) => !selectedPoints.includes(point));
      const width = 960;
      const height = 480;
      const margin = { left: 100, right: 30, top: 30, bottom: 50 };
      const maxX = Math.max(...points.map((p) => p.power_total_mw)) || 1;
      const maxY = Math.max(...points.map((p) => p.area_um2)) || 1;
      const x = (v) => margin.left + (v / maxX) * (width - margin.left - margin.right);
      const y = (v) => height - margin.bottom - (v / maxY) * (height - margin.top - margin.bottom);
      svg.appendChild(svgEl('line', { x1: margin.left, y1: height - margin.bottom, x2: width - margin.right, y2: height - margin.bottom, stroke: '#64748b' }));
      svg.appendChild(svgEl('line', { x1: margin.left, y1: margin.top, x2: margin.left, y2: height - margin.bottom, stroke: '#64748b' }));
      const xLabel = svgEl('text', { x: width / 2, y: height - 10, 'text-anchor': 'middle', fill: '#475569', 'font-size': 13 });
      xLabel.textContent = 'Power (mW)';
      svg.appendChild(xLabel);
      const yLabel = svgEl('text', { x: 18, y: height / 2, transform: `rotate(-90 18 ${height / 2})`, 'text-anchor': 'middle', fill: '#475569', 'font-size': 13 });
      yLabel.textContent = 'Area (um²)';
      svg.appendChild(yLabel);

      for (let tick = 0; tick <= 4; tick += 1) {
        const xv = maxX * tick / 4;
        const yv = maxY * tick / 4;
        const xt = svgEl('text', { x: x(xv), y: height - margin.bottom + 20, 'text-anchor': 'middle', fill: '#475569', 'font-size': 12 });
        xt.textContent = tickLabel(xv);
        const yt = svgEl('text', { x: margin.left - 8, y: y(yv) + 4, 'text-anchor': 'end', fill: '#475569', 'font-size': 12 });
        yt.textContent = tickLabel(yv);
        svg.append(xt, yt);
      }
      detail.textContent = `${selectedPoints.length} matching ${kind === 'array' ? 'array' : 'unit'} points. Hover, tap, or focus a point to inspect its synthesis result.`;

      backgroundPoints.forEach((point) => {
        const circle = svgEl('circle', {
          cx: x(point.power_total_mw),
          cy: y(point.area_um2),
          r: kind === 'array' ? 5 : 3.5,
          fill: kind === 'array' ? '#e68a00' : '#2364d2',
          opacity: 0.15,
        });
        const dimensions = kind === 'array' ? `M=${point.dim_m}, N=${point.dim_n}, ` : '';
        inspectOnInteraction(circle, detail, `${kind === 'array' ? 'Synthesized array' : 'Synthesized unit'}: precision=${point.precision_name}, clk=${point.clk_mhz} MHz, ${dimensions}K=${point.dim_k}, MX=${point.mx_flag}, NV=${point.nv_flag}, area=${point.area_um2.toFixed(2)} µm², power=${point.power_total_mw.toFixed(3)} mW`);
        svg.appendChild(circle);
      });

      selectedPoints.forEach((point) => {
        const circle = svgEl('circle', {
          cx: x(point.power_total_mw),
          cy: y(point.area_um2),
          r: kind === 'array' ? 7 : 5,
          fill: kind === 'array' ? '#e68a00' : '#2364d2',
          opacity: 0.95,
          stroke: '#0f172a',
          'stroke-width': 1.5,
        });
        const dimensions = kind === 'array' ? `M=${point.dim_m}, N=${point.dim_n}, ` : '';
        inspectOnInteraction(circle, detail, `${kind === 'array' ? 'Synthesized array' : 'Synthesized unit'}: precision=${point.precision_name}, clk=${point.clk_mhz} MHz, ${dimensions}K=${point.dim_k}, MX=${point.mx_flag}, NV=${point.nv_flag}, area=${point.area_um2.toFixed(2)} µm², power=${point.power_total_mw.toFixed(3)} mW`);
        svg.appendChild(circle);
      });
    };

    const unitClocks = ['all', ...Array.from(new Set(unitPoints.map((p) => p.clk_mhz))).sort((a, b) => a - b)];
    const unitPrecisions = ['all', ...Array.from(new Set(unitPoints.map((p) => p.precision_name))).sort()];
    const arrayClocks = ['all', ...Array.from(new Set(arrayPoints.map((p) => p.clk_mhz))).sort((a, b) => a - b)];
    const arrayPrecisions = ['all', ...Array.from(new Set(arrayPoints.map((p) => p.precision_name))).sort()];
    setOptions(unitClkSelect, unitClocks, 'all');
    setOptions(unitPrecisionSelect, unitPrecisions, 'all');
    setOptions(arrayClkSelect, arrayClocks, 'all');
    setOptions(arrayPrecisionSelect, arrayPrecisions, 'all');

    const renderUnit = () => renderScatter({
      svg: unitSvg,
      detail: unitDetail,
      points: unitPoints,
      clkSelect: unitClkSelect,
      precisionSelect: unitPrecisionSelect,
      kind: 'dp_unit',
    });
    const renderArray = () => renderScatter({
      svg: arraySvg,
      detail: arrayDetail,
      points: arrayPoints,
      clkSelect: arrayClkSelect,
      precisionSelect: arrayPrecisionSelect,
      kind: 'array',
    });

    unitClkSelect.addEventListener('change', renderUnit);
    unitPrecisionSelect.addEventListener('change', renderUnit);
    arrayClkSelect.addEventListener('change', renderArray);
    arrayPrecisionSelect.addEventListener('change', renderArray);
    renderUnit();
    renderArray();
    setChartControlsBusy(['ppa-unit-filter-form', 'ppa-array-filter-form'], false);
  }).catch((error) => {
    unitDetail.textContent = `(Failed to load PPA data) ${error.message}`;
    arrayDetail.textContent = `(Failed to load PPA data) ${error.message}`;
  });
}

function initBaseline() {
  const svg = document.getElementById('baseline-chart');
  if (!svg) return;
  const detail = document.getElementById('baseline-detail');
  const precisionSelect = document.getElementById('baseline-precision');
  const metricSelect = document.getElementById('baseline-metric');

  setChartControlsBusy(['baseline-filter-form'], true);
  fetchChartJson('/api/baseline-data').then((payload) => {
    const points = payload.series[0]?.points || [];
    const precisions = Array.from(new Set(points.map((p) => p.precision_name))).sort();
    setOptions(precisionSelect, precisions, precisions[0], (value) => ({ value: String(value), label: String(value) }));

    const render = () => {
      svgClear(svg);
      const precision = precisionSelect.value;
      const metric = metricSelect.value;
      const filtered = points.filter((p) => p.precision_name === precision);
      if (!filtered.length) {
        detail.textContent = '(No baseline rows for the selected precision.)';
        return;
      }
      const width = 960;
      const height = 480;
      const margin = { left: 70, right: 30, top: 30, bottom: 60 };
      const ks = Array.from(new Set(filtered.map((p) => p.dim_k))).sort((a, b) => a - b);
      const grouped = ks.map((k) => ({
        k,
        baseline: filtered.find((p) => p.dim_k === k && p.design_name.includes('baseline')),
        wrapper: filtered.find((p) => p.dim_k === k && p.design_name.includes('Wrapper')),
      }));
      const maxY = Math.max(...grouped.flatMap((g) => [g.baseline?.[metric] || 0, g.wrapper?.[metric] || 0])) || 1;
      const band = (width - margin.left - margin.right) / grouped.length;
      const scaleY = (v) => height - margin.bottom - (v / maxY) * (height - margin.top - margin.bottom);

      const metricLabel = metric === 'area_um2' ? 'Area (µm²)' : 'Power (mW)';
      detail.textContent = `${precision}: ${ks.length} K values, clocks ${Array.from(new Set(filtered.map((p) => p.clk_mhz))).join(', ')} MHz. Gray: Baseline; blue: TensorForge. Hover, tap, or focus a bar for values.`;
      for (let tick = 0; tick <= 4; tick += 1) {
        const value = maxY * tick / 4;
        svg.appendChild(svgEl('line', { x1: margin.left, x2: width - margin.right, y1: scaleY(value), y2: scaleY(value), stroke: '#d6e0ef' }));
        const label = svgEl('text', { x: margin.left - 8, y: scaleY(value) + 4, 'text-anchor': 'end', fill: '#475569', 'font-size': 12 });
        label.textContent = tickLabel(value);
        svg.appendChild(label);
      }
      const axisLabel = svgEl('text', { x: margin.left, y: 18, fill: '#475569', 'font-size': 13 });
      axisLabel.textContent = metricLabel;
      svg.appendChild(axisLabel);
      grouped.forEach((g, index) => {
        const x0 = margin.left + index * band + 10;
        const bars = [
          { label: 'Baseline', value: g.baseline?.[metric], color: '#64748b' },
          { label: 'TensorForge', value: g.wrapper?.[metric], color: '#2364d2' },
        ];
        bars.forEach((bar, barIndex) => {
          if (!Number.isFinite(bar.value)) return;
          const barWidth = (band - 30) / 2;
          const x = x0 + barIndex * (barWidth + 10);
          const yVal = scaleY(bar.value);
          const rect = svgEl('rect', {
            x,
            y: yVal,
            width: barWidth,
            height: height - margin.bottom - yVal,
            fill: bar.color,
            rx: 4,
          });
          inspectOnInteraction(rect, detail, `${precision}, K=${g.k}, ${bar.label}: ${metricLabel}=${bar.value.toFixed(3)}`);
          svg.appendChild(rect);
        });
        const text = svgEl('text', { x: x0 + (band - 30) / 2, y: height - 20, 'text-anchor': 'middle', fill: '#475569', 'font-size': 12 });
        text.textContent = `K=${g.k}`;
        svg.appendChild(text);
      });
    };

    precisionSelect.addEventListener('change', render);
    metricSelect.addEventListener('change', render);
    render();
    setChartControlsBusy(['baseline-filter-form'], false);
  }).catch((error) => {
    detail.textContent = `(Failed to load baseline data) ${error.message}`;
  });
}

function donutPath(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  const sx = cx + rOuter * Math.cos(startAngle);
  const sy = cy + rOuter * Math.sin(startAngle);
  const ex = cx + rOuter * Math.cos(endAngle);
  const ey = cy + rOuter * Math.sin(endAngle);
  const isx = cx + rInner * Math.cos(endAngle);
  const isy = cy + rInner * Math.sin(endAngle);
  const iex = cx + rInner * Math.cos(startAngle);
  const iey = cy + rInner * Math.sin(startAngle);
  return [
    `M ${sx} ${sy}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${ex} ${ey}`,
    `L ${isx} ${isy}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${iex} ${iey}`,
    'Z',
  ].join(' ');
}

function initBreakdown() {
  const svg = document.getElementById('breakdown-chart');
  if (!svg) return;
  const detail = document.getElementById('breakdown-detail');
  const seriesSelect = document.getElementById('breakdown-series');

  setChartControlsBusy(['breakdown-filter-form'], true);
  fetchChartJson('/api/breakdown-data').then((payload) => {
    setOptions(seriesSelect, payload.series.map((series, index) => index), 0, (value) => ({ value: String(value), label: payload.series[value].name }));
    const render = () => {
      svgClear(svg);
      const series = payload.series[Number(seriesSelect.value)];
      const points = series?.points || [];
      const total = points.reduce((sum, point) => sum + point.value, 0);
      if (total <= 0) {
        detail.textContent = 'No area rows available for this dataset.';
        return;
      }
      detail.textContent = `${series.name}: ${total.toFixed(2)} µm² across ${points.length} components. Hover, tap, or focus a slice to inspect its share.`;
      let angle = -Math.PI / 2;
      const cx = 320;
      const cy = 250;
      const rOuter = 170;
      const rInner = 90;
      points.forEach((point, index) => {
        const slice = (point.value / total) * Math.PI * 2;
        const path = svgEl('path', {
          d: donutPath(cx, cy, rOuter, rInner, angle, angle + slice),
          fill: colorForIndex(index),
          stroke: '#ffffff',
          'stroke-width': 2,
        });
        inspectOnInteraction(path, detail, `${series.name}, ${point.label}: area=${point.value.toFixed(2)} µm², share=${((point.value / total) * 100).toFixed(2)}%`);
        svg.appendChild(path);
        const legend = svgEl('text', { x: 580, y: 40 + index * 22, fill: colorForIndex(index), 'font-size': 13 });
        legend.textContent = `${point.label} (${((point.value / total) * 100).toFixed(1)}%)`;
        svg.appendChild(legend);
        angle += slice;
      });
      const centerText = svgEl('text', { x: cx, y: cy - 9, 'text-anchor': 'middle', fill: '#0f172a', 'font-size': 14, 'font-weight': '700' });
      const centerLines = series.name === 'SM Top Area Breakdown'
        ? ['SM Top Area', 'Breakdown']
        : series.name === 'Rolled Component Breakdown'
          ? ['Rolled Component', 'Breakdown']
          : [series.name];
      centerLines.forEach((line, index) => {
        const span = svgEl('tspan', { x: cx, dy: index === 0 ? 0 : 20 });
        span.textContent = line;
        centerText.appendChild(span);
      });
      svg.appendChild(centerText);
    };
    seriesSelect.addEventListener('change', render);
    render();
    setChartControlsBusy(['breakdown-filter-form'], false);
  }).catch((error) => {
    detail.textContent = `(Failed to load breakdown data) ${error.message}`;
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initPPA();
  initBaseline();
  initBreakdown();
});
