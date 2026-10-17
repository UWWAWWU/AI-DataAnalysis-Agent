export function validateReview(value, columns) { const p = value; if (!p || !['inspect', 'remove_duplicates', 'remove_matching'].includes(p.operation) || !['all', 'active'].includes(p.scope) || !p.selection || !['duplicates', 'rows'].includes(p.selection.kind) || !Array.isArray(p.selection.rules) || p.selection.rules.length > 8)
    throw Error('Invalid data review request.'); for (const r of p.selection.rules)
    if (!r || typeof r.column !== 'string' || columns && !columns.includes(r.column) || !['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'contains', 'missing', 'notMissing'].includes(r.op) || r.value !== undefined && !['string', 'number'].includes(typeof r.value))
        throw Error('Invalid review condition.'); if (p.selection.kind === 'rows' && !p.selection.rules.length)
    throw Error('A row selection must include a condition.'); if (p.operation === 'remove_duplicates' && p.selection.kind !== 'duplicates')
    throw Error('Exact duplicate removal requires duplicate groups.'); if (p.operation === 'remove_matching' && p.selection.kind !== 'rows')
    throw Error('Use exact duplicate removal for duplicate groups.'); return p; }
export function columnsOf(rows) { const cols = new Set(); for (const row of rows)
    for (const col of Object.keys(row))
        cols.add(col); return [...cols]; }
export function duplicateIndexes(rows, columns = columnsOf(rows)) { const groups = new Map(); rows.forEach((row, i) => { const key = JSON.stringify(columns.map(c => row[c] ?? null)); const group = groups.get(key); if (group)
    group.push(i);
else
    groups.set(key, [i]); }); return [...groups.values()].filter(g => g.length > 1); }
export function matches(row, rules) { return rules.every(rule => { const v = row[rule.column], missing = v == null || v === ''; if (rule.op === 'missing')
    return missing; if (rule.op === 'notMissing')
    return !missing; if (rule.op === 'contains')
    return String(v ?? '').toLowerCase().includes(String(rule.value ?? '').toLowerCase()); if (rule.op === 'eq')
    return String(v ?? '') === String(rule.value ?? ''); if (rule.op === 'ne')
    return String(v ?? '') !== String(rule.value ?? ''); if (missing || !Number.isFinite(Number(v)) || !Number.isFinite(Number(rule.value)))
    return false; const n = Number(v), target = Number(rule.value); return rule.op === 'gt' ? n > target : rule.op === 'ge' ? n >= target : rule.op === 'lt' ? n < target : n <= target; }); }
