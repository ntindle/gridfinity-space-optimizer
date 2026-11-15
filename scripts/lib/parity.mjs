export const scoreCell = (cell) => {
  const text = String(cell ?? '').trim();
  if (text.startsWith('✅')) return 1;
  if (text.startsWith('🟡')) return 0.5;
  return 0;
};

export const measureParity = (markdown) => {
  const rows = String(markdown).split('\n').filter((l) => /^\|\s*F\d+/.test(l));
  if (!rows.length) return null;
  let supported = 0;
  let partial = 0;
  let score = 0;
  for (const line of rows) {
    const ours = line.split('|')[3]?.trim() ?? '';
    const value = scoreCell(ours);
    score += value;
    if (value === 1) supported += 1;
    else if (value === 0.5) partial += 1;
  }
  return { rows: rows.length, supported, partial, percent: Math.round((score / rows.length) * 1000) / 10 };
};
