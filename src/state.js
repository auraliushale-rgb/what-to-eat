import { brands, belongsToMeal, byId, categories, preferences, restrictions } from './catalog.js';

const key = 'what-to-eat:v1';
const initial = () => ({
  preferences: [], restrictions: [], custom: '', excluded: [], favorites: [], history: [],
  last: {}, plan: {}, includeSnack: true, includeTea: true, brand: '',
});
const array = (value, accept) => Array.isArray(value) ? value.filter(accept) : [];
const idExists = value => byId.has(value);
const isObject = value => value && typeof value === 'object';

export function loadState(storage) {
  try {
    const raw = JSON.parse(storage.getItem(key) ?? '{}');
    if (!isObject(raw)) return initial();
    const state = initial();
    state.preferences = array(raw.preferences, x => preferences.includes(x));
    state.restrictions = array(raw.restrictions, x => restrictions.includes(x));
    state.custom = typeof raw.custom === 'string' ? raw.custom.slice(0, 1000) : '';
    state.excluded = array(raw.excluded, idExists);
    state.favorites = array(raw.favorites, idExists);
    state.history = array(raw.history, entry => isObject(entry) && idExists(entry.id) && Number.isFinite(entry.at) && entry.at > 0 && entry.at < 8.64e15).slice(0, 500);
    state.brand = brands.some(brand => brand.name === raw.brand) ? raw.brand : '';
    for (const field of ['includeSnack', 'includeTea']) {
      if (typeof raw[field] === 'boolean') state[field] = raw[field];
    }
    for (const category of categories) {
      const last = raw.last?.[category];
      if (belongsToMeal(last, category)) state.last[category] = last;
      const saved = raw.plan?.[category];
      const picks = [...new Set((Array.isArray(saved) ? saved : [saved]).filter(id => belongsToMeal(id, category)))];
      if (picks.length) state.plan[category] = picks;
    }
    return state;
  } catch {
    return initial();
  }
}
export function saveState(storage, state) {
  try {
    storage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
export function record(state, item, time = Date.now()) {
  state.last[item.category] = item.id;
  state.history = [{ id: item.id, at: time }, ...state.history].slice(0, 500);
}
