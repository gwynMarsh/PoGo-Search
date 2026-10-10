/* Commas match alternatives; ampersands require every clause. No parentheses needed. */
function generateSearch({ groups = {}, minCp = '', maxCp = '', invalidCp = false, count = 0, exact = false }) {
  const errors = [];
  const customCp = minCp !== '' || maxCp !== '';
  const validCp = value => value === '' || (/^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) >= 10);
  if (invalidCp || !validCp(minCp) || !validCp(maxCp)) errors.push('CP must be a whole number of at least 10.');
  if (minCp !== '' && maxCp !== '' && Number(minCp) > Number(maxCp)) errors.push('Minimum CP must not exceed maximum CP.');
  const positives = Object.values(groups).flat().filter(term => !term.startsWith('!'));
  for (const exclusion of groups.exclusions || []) {
    if (positives.includes(exclusion.slice(1))) errors.push(`Remove either ${exclusion.slice(1)} or its exclusion.`);
  }
  const status = groups.status || [];
  if (status.includes('shadow') && status.includes('purified')) errors.push('A Pokémon cannot be both Shadow and Purified.');
  if (status.includes('legendary') && status.includes('mythical')) errors.push('Choose either Legendary or Mythical.');
  if (status.includes('shadow') && status.includes('lucky')) errors.push('A Shadow Pokémon cannot be Lucky.');
  if ((groups.attack || []).includes('0attack') && (groups.stars || []).length && groups.stars.every(term => term === '3*' || term === '4*')) errors.push('Zero Attack cannot have a 3-star or 4-star appraisal.');
  if (errors.length) return { query: '', errors };
  const clauses = [];
  if (count > 0) clauses.push(exact ? `count${count}` : `count${count}-`);
  for (const [name, filters] of Object.entries(groups)) {
    if (!filters.length || (name === 'cp' && customCp)) continue;
    clauses.push(filters.join(name === 'status' || name === 'exclusions' || name === 'attack' ? '&' : ','));
  }
  if (customCp) clauses.push(minCp && maxCp && minCp === maxCp ? `cp${minCp}` : `cp${minCp}-${maxCp}`);
  return { query: clauses.join('&'), errors: [] };
}
if (typeof module !== 'undefined') module.exports = { generateSearch };
