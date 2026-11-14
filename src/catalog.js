import placements from './data/meal-placements.json' with { type: 'json' };
import breakfast from './data/breakfast.json' with { type: 'json' };
import lunch from './data/lunch.json' with { type: 'json' };
import dinner from './data/dinner.json' with { type: 'json' };
import snack from './data/late-night-snack.json' with { type: 'json' };
import tea from './data/milk-tea.json' with { type: 'json' };
import brands from './data/brands.json' with { type: 'json' };

export { brands };
const baseCatalog = {
  Breakfast: breakfast, Lunch: lunch, Dinner: dinner, 'Late-night Snack': snack, 'Milk Tea': tea,
};
export const items = Object.values(baseCatalog).flat();
export const byId = new Map(items.map(item => [item.id, item]));
export const categories = Object.keys(baseCatalog);
export const catalog = Object.fromEntries(categories.map(category => {
  const meal = new Map(baseCatalog[category].map(item => [item.id, item]));
  for (const [id, cuisines] of Object.entries(placements[category] || {})) {
    const item = byId.get(id);
    meal.set(id, {...item, category, cuisine:cuisines[0], cuisineAliases:cuisines.slice(1)});
  }
  return [category, [...meal.values()]];
}));
export const belongsToMeal = (id, category) =>
  byId.get(id)?.category === category || Object.hasOwn(placements[category] || {}, id);
export const chinese = new Set([
  'Northern Chinese', 'Shanghai', 'Cantonese', 'Jiangsu', 'Zhejiang', 'Hubei', 'Henan', 'Fujian',
  'Taiwanese', 'Sichuan', 'Hunan', 'Shandong', 'Anhui', 'Northeastern Chinese', 'Shaanxi',
  'Gansu', 'Chongqing', 'Yunnan', 'Xinjiang', 'Guangxi', 'Chinese Home Cooking', 'Hainan',
  'Guizhou', 'Jiangxi', 'Macanese',
]);
const western = new Set(['French', 'American', 'British', 'Spanish', 'Nordic', 'Australian', 'Swiss', 'Greek', 'Italian', 'Belgian']);
const cuisineMatches = {
  'Chinese Food': item => chinese.has(item.cuisine),
  'Japanese Food': item => item.cuisine === 'Japanese',
  'Korean Food': item => item.cuisine === 'Korean',
  'Western Food': item => western.has(item.cuisine),
  'Italian Food': item => item.cuisine === 'Italian',
  'Healthy Food': item => item.dietaryTags.includes('Healthy'),
  'Vegetarian Food': item => item.dietaryTags.includes('Vegetarian'),
  'Spicy Food': item => item.dietaryTags.includes('Spicy'),
  'Fast Food': item => item.dietaryTags.includes('Fast Food'),
  Seafood: item => item.dietaryTags.includes('Seafood'),
};
export const preferences = Object.keys(cuisineMatches);
const restrictionMatches = {
  'No Beef': /\bbeef\b|\bveal\b|\bbovine\b|\box tail\b/,
  'No Pork': /\bpork\b|\bbacon\b|\bham\b|\blard\b|prosciutto|guanciale|chorizo|andouille|luncheon meat|chinese sausage/,
  'No Chicken': /\bchicken\b|poultry/,
  'No Seafood': /\bseafood\b|\bfish\b|crustaceans|molluscs|shrimp|squid|oyster|anchov|bonito|fish sauce/,
  'No Eggs': /\beggs?\b|mayonnaise|custard/,
  'No Dairy': /\bdairy\b/,
  'No Peanuts': /peanut|\bsatay\b/,
  'No Mushrooms': /mushroom|shiitake|wood ear|truffle|porcini|enoki/,
  'No Spicy Food': /\bspicy\b|\bchili\b|\bchile\b|cayenne|berbere|gochujang|gochugaru|jalapeno|serrano|sambal/,
};
export const restrictions = Object.keys(restrictionMatches);
const strict = new Set(['No Seafood', 'No Eggs', 'No Dairy', 'No Peanuts']);
export const normalize = value => value.normalize('NFKD').toLowerCase().replace(/\p{Mark}/gu, '').trim();
export const menuEligible = item => !['archived', 'unavailable'].includes(item.availability);
export function searchable(item) {
  return normalize([item.name, item.nameChinese, item.brand, item.cuisine, item.productCategory, ...item.ingredients].filter(Boolean).join(' '));
}
function blocks(item, state) {
  if (state.excluded.includes(item.id) || !menuEligible(item)) return true;
  const terms = state.custom.split(/[,\n;]/).map(normalize).filter(Boolean);
  const hasFullDeclaration = item.ingredientEvidence === 'verified-complete';
  const evidence = normalize([item.name, ...item.ingredients, ...item.allergens, ...item.dietaryTags].join(' '));
  if (state.restrictions.some(rule => (!hasFullDeclaration && strict.has(rule)) || restrictionMatches[rule]?.test(evidence))) return true;
  return terms.some(term => searchable(item).includes(term) || evidence.includes(term));
}
export function eligible(category, state, brand = state.brand) {
  const pool = (catalog[category] ?? []).filter(item => (!item.brand || !brand || item.brand === brand) && !blocks(item, state));
  const preferred = pool.filter(item => state.preferences.some(rule => cuisineMatches[rule]?.(item)));
  return preferred.length ? preferred : pool;
}

export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function wheelDraw(pool, previous, random = Math.random, limit = 8) {
  const available = pool.length > 1 ? pool.filter(item => item.id !== previous) : pool;
  const segments = shuffle(available, random).slice(0, limit);
  const index = Math.floor(random() * segments.length);
  return { segments, index, result: segments[index] ?? null };
}
export function stopAngle(index, count, random = Math.random) {
  const arc = 360 / count;
  return 360 * (5 + Math.floor(random() * 2)) - (index + 0.22 + random() * 0.56) * arc;
}
export function pointerIndex(angle, count) {
  return Math.floor((((-angle % 360) + 360) % 360) / (360 / count));
}
