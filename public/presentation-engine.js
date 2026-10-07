export function patchPresentation(spec, raw) { if (!Array.isArray(raw) || !raw.length || raw.length > 6)
    throw Error('Invalid chart changes.'); const next = structuredClone(spec); for (const patch of raw) {
    if (!patch || Object.keys(patch).some(k => !['chartTitle', 'view', 'width', 'limit'].includes(k)) || typeof patch.chartTitle !== 'string' || !['view', 'width', 'limit'].some(k => k in patch))
        throw Error('Unsupported chart change.');
    const matches = next.charts.filter(c => c.title === patch.chartTitle);
    if (matches.length !== 1)
        throw Error('The chart could not be uniquely identified. Use its exact title.');
    if (patch.view && !['area', 'line', 'bar', 'ranking', 'table', 'pie', 'donut', 'treemap', 'histogram', 'scatter', 'boxplot'].includes(patch.view) || patch.width && !['wide', 'standard'].includes(patch.width) || patch.limit !== undefined && (!Number.isInteger(patch.limit) || patch.limit < 1 || patch.limit > 100))
        throw Error('Invalid chart presentation.');
    if (patch.view && ['histogram', 'scatter', 'boxplot'].includes(patch.view) && patch.view !== matches[0].view)
        throw Error('This chart requires a new analysis.');
    Object.assign(matches[0], Object.fromEntries(Object.entries(patch).filter(([k]) => k !== 'chartTitle')));
} return next; }
export const PRESENTATION_INSTRUCTIONS = `For requests that ONLY change an existing chart's type, size, or displayed category count, return action "presentation" and chartChanges:[{chartTitle:exact existing title,view?:"area"|"line"|"bar"|"ranking"|"table"|"pie"|"donut"|"treemap",width?:"wide"|"standard",limit?:integer}]. Use ranking for horizontal ranked bars, bar for vertical bars. Identify charts from previousDashboard. Preserve every metric, rule, KPI, filter and other chart. Do not use update for presentation-only requests. Pie, donut and treemap can display nonnegative additive category values. Histogram, scatter and boxplot require new raw-data calculations: use update when changing an aggregate chart to these types. The application automatically applies validated presentation changes. Never mention Apply changes, a draft, row review, or a required confirmation for this action. Do not claim completion before the application applies the tool. Use update only for new calculations or changed metrics. `;
