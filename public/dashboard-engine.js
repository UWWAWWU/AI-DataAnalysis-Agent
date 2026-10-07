export function validateSpec(v, columns) {
    const s = v;
    if (!s || typeof s !== 'object' || typeof s.countryColumn !== 'string' || typeof s.dateColumn !== 'string' || !Array.isArray(s.metrics) || !s.metrics.length || s.metrics.length > 8 || !Array.isArray(s.kpis) || s.kpis.length > 8 || !Array.isArray(s.charts) || s.charts.length > 24)
        throw Error('Spesifikasi dashboard tidak valid.');
    for (const chart of s.charts)
        for (const key of ['xColumn', 'yColumn', 'bins', 'view', 'width', 'displayView'])
            if (chart[key] === null)
                delete chart[key];
    for (const kpi of s.kpis)
        for (const key of ['metric', 'numerator', 'denominator', 'denominatorExtra', 'scale'])
            if (kpi[key] === null)
                delete kpi[key];
    if (s.layout && !['kpi-first', 'charts-first'].includes(s.layout))
        throw Error('Invalid dashboard layout.');
    const col = (x) => typeof x === 'string' && (!columns || columns.includes(x));
    for (const x of [s.countryColumn, s.dateColumn])
        if (x && !col(x))
            throw Error('Kolom filter tidak valid.');
    const ids = new Set();
    for (const m of s.metrics) {
        if (!m || typeof m.id !== 'string' || ids.has(m.id) || !['sum', 'mean', 'count', 'distinct'].includes(m.operation) || !Array.isArray(m.columns) || m.columns.length > 2 || !m.columns.every(col) || !Array.isArray(m.rules) || m.rules.length > 8)
            throw Error('Metrik tidak valid.');
        ids.add(m.id);
        if (m.operation !== 'count' && !m.columns.length)
            throw Error('Kolom metrik diperlukan.');
        for (const r of m.rules)
            if (!col(r.column) || !['gt', 'ge', 'lt', 'le', 'eq', 'ne', 'prefix', 'notPrefix', 'notEmpty'].includes(r.op) || !['undefined', 'string', 'number'].includes(typeof r.value))
                throw Error('Aturan metrik tidak valid.');
    }
    for (const k of s.kpis)
        if (!k || typeof k.label !== 'string' || k.label.length > 200 || (k.metric ? !ids.has(k.metric) : !ids.has(k.numerator || '') || !ids.has(k.denominator || '')) || (k.denominatorExtra !== undefined && !ids.has(k.denominatorExtra)) || (k.scale !== undefined && (!Number.isFinite(k.scale) || Math.abs(k.scale) > 100000)))
            throw Error('KPI tidak valid.');
    for (const c of s.charts)
        if (!c || c.displayView && c.displayView !== 'table' || c.view && !['area', 'line', 'bar', 'ranking', 'table', 'pie', 'donut', 'treemap', 'histogram', 'scatter', 'boxplot'].includes(c.view) || c.width && !['wide', 'standard'].includes(c.width) || typeof c.title !== 'string' || !ids.has(c.metric) || !col(c.groupBy) || typeof c.time !== 'boolean' || !Number.isInteger(c.limit) || c.limit < 1 || c.limit > 100)
            throw Error('Grafik tidak valid.');
    for (const c of s.charts) {
        if (c.position && (!['x', 'y', 'w', 'h', 'page'].every(k => Number.isInteger(c.position[k])) || c.position.x < 0 || c.position.y < 0 || c.position.w < 3 || c.position.h < 3 || c.position.x + c.position.w > 12 || c.position.y + c.position.h > 12 || c.position.page < 0 || c.position.page > 99))
            throw Error('Invalid dashboard position.');
        if (['histogram', 'scatter', 'boxplot'].includes(c.view || '') && (!c.xColumn || !col(c.xColumn)))
            throw Error('A numeric xColumn is required.');
        if (c.view === 'scatter' && (!c.yColumn || !col(c.yColumn)))
            throw Error('A numeric yColumn is required.');
        if (c.view === 'histogram' && s.metrics.find(m => m.id === c.metric)?.operation !== 'count')
            throw Error('Histogram requires a count metric.');
        if (c.bins !== undefined && (!Number.isInteger(c.bins) || c.bins < 2 || c.bins > 50))
            throw Error('Invalid histogram bins.');
    }
    return s;
}
export function reduceCube(cube, f) {
    const v = cube.variants[f.deduplicate ? 1 : 0], s = cube.spec;
    const match = (country, date) => (!f.country || country === f.country) && (!f.from || date >= f.from) && (!f.to || date <= f.to);
    const merge = (a, b) => [a[0] + b[0], a[1] + b[1], [...a[2], ...b[2]]];
    const value = (m, a) => m.operation === 'distinct' ? new Set(a[2]).size : m.operation === 'count' ? a[1] : m.operation === 'mean' ? (a[1] ? a[0] / a[1] : 0) : a[0];
    const totals = s.metrics.map(() => [0, 0, []]);
    for (const [country, date, i, a] of v.metrics)
        if (match(country, date))
            totals[i] = merge(totals[i], a);
    const values = Object.fromEntries(s.metrics.map((m, i) => [m.id, value(m, totals[i])]));
    const kpis = {};
    for (const k of s.kpis)
        kpis[k.label] = k.metric ? values[k.metric] : ((values[k.denominator] + (values[k.denominatorExtra || ''] || 0)) ? values[k.numerator] / (values[k.denominator] + (values[k.denominatorExtra || ''] || 0)) * (k.scale ?? 1) : 0);
    const groups = s.charts.map(() => new Map());
    for (const [country, date, i, key, a] of v.charts)
        if (match(country, date))
            groups[i].set(key, merge(groups[i].get(key) || [0, 0, []], a));
    const charts = s.charts.map((c, i) => { if (c.view === 'histogram')
        for (const label of v.histogramLabels?.[String(i)] || [])
            if (!groups[i].has(label))
                groups[i].set(label, [0, 0, []]); const m = s.metrics.find(m => m.id === c.metric); const entries = [...groups[i]].map(([key, a]) => [key, value(m, a)]).sort(c.view === 'histogram' ? (a, b) => Number(a[0].split(' — ')[0]) - Number(b[0].split(' — ')[0]) : c.time ? (a, b) => a[0].localeCompare(b[0]) : (a, b) => b[1] - a[1]).slice(0, c.view === 'histogram' ? (c.bins || 10) : c.limit); const observations = (v.observations || []).filter(([country, date, j]) => j === i && match(country, date)); const sorted = (numbers) => numbers.sort((a, b) => a - b); const quantile = (a, q) => { const position = (a.length - 1) * q, lo = Math.floor(position); return a[lo] + (a[Math.ceil(position)] - a[lo]) * (position - lo); }; const boxes = c.view === 'boxplot' ? [...new Set(observations.map(o => o[3]))].slice(0, c.limit).map(name => { const a = sorted(observations.filter(o => o[3] === name).map(o => o[4])); return { name, low: a[0], q1: quantile(a, .25), median: quantile(a, .5), q3: quantile(a, .75), high: a[a.length - 1] }; }) : undefined; return { position: c.position, id: JSON.stringify([c.title, c.metric, c.groupBy]), displayView: c.displayView, points: ['scatter', 'boxplot', 'histogram'].includes(c.view || '') ? observations.map(o => ({ x: o[4], ...(c.view === 'scatter' ? { y: o[5] } : {}), group: o[3] })) : undefined, boxes, sampled: v.sampledCharts?.includes(i), groupColumn: c.groupBy, xColumn: c.xColumn, yColumn: c.yColumn, title: c.title, time: c.time, view: c.view || (c.time ? 'area' : 'ranking'), width: c.width || 'standard', labels: entries.map(x => x[0]), values: entries.map(x => x[1]) }; });
    const rows = v.rows.reduce((n, [country, date, count]) => n + (match(country, date) ? count : 0), 0);
    return { rows, kpis, charts, definitions: describeSpec(s), cleaning_log: [f.deduplicate ? 'Exact duplicates across every column are excluded; the first row is retained. Timestamps are compared without rounding.' : 'Exact duplicate rows are retained. The source file is unchanged.'] };
}
export function describeSpec(s) { return s.kpis.map(k => { if (!k.metric)
    return `${k.label} = ${k.numerator} / (${k.denominator}${k.denominatorExtra ? ' + ' + k.denominatorExtra : ''})${k.scale && k.scale !== 1 ? ' × ' + k.scale : ''}. A zero denominator returns zero.`; const m = s.metrics.find(m => m.id === k.metric); const rule = m.rules.map(r => `${r.column} ${r.op}${r.value !== undefined ? ' ' + r.value : ''}`).join('; '); return `${k.label}: ${m.operation} of ${m.columns.length ? m.columns.join(' × ') : 'rows'}${rule ? ' where ' + rule : ''}.`; }).concat(['Filters are calculated locally from Python-prepared aggregates. Distinct counts are recomputed from anonymized identifier sets; ratios use their underlying totals.', 'Monthly boundary periods may be incomplete. Category rankings show the configured top categories, not every category. No currency or profit assumption is made unless defined by the source.']); }
