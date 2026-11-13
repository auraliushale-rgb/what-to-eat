import { brands, byId, catalog, categories, eligible, menuEligible, preferences, restrictions, searchable, normalize, shuffle, stopAngle, wheelDraw } from './catalog.js';
import { loadState, record, saveState } from './state.js';

const main = document.querySelector('main');
const navigation = document.querySelector('#navigation');
const toast = document.querySelector('#toast');
const dialog = document.querySelector('#details');
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const state = loadState(storage);
const routes = {home: 'Home', roulette: 'Food Roulette', plan: 'Daily Meal Plan', tea: 'Milk Tea Explorer', favorites: 'Favorites', preferences: 'Preferences'};
const symbols = {
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-7h6v7"/>',
  roulette:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8m0-12.8L5.6 18.4"/>',
  plan:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18m-14 5 3 3 5-5"/>',
  tea:'<path d="M5 8h14l-2 12H7L5 8Zm7 0 2-5h4M4 8h16M9 15h.01M14 17h.01M15 12h.01"/>',
  favorites:'<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1l1.7 1.7L12 21l7.1-6.6 1.7-1.7a5 5 0 0 0 0-7.1Z"/>',
  preferences:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
  breakfast:'<path d="M3 17h18M5 21h14m-12-8a5 5 0 0 1 10 0M12 3v3M5 7l2 2m12-2-2 2"/>',
  lunch:'<path d="M3 11h18a9 9 0 0 1-18 0Zm5 9h8M9 8V5m3 3V3m3 5V5"/>',
  dinner:'<path d="M3 17h18M5 17a7 7 0 1 1 14 0m-7-7V7m-2 0h4M4 20h16"/>',
  snack:'<path d="M20.8 14.5A9 9 0 0 1 9.5 3.2a9 9 0 1 0 11.3 11.3ZM16 4v4m-2-2h4m3 2v4m-2-2h4"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  shuffle:'<path d="M3 6h3c4 0 6 12 11 12h4m-4-4 4 4-4 4M3 18h3c2 0 3.5-3 5-6s3-6 6-6h4m-4-4 4 4-4 4"/>',
};
const categoryIcons = ['breakfast', 'lunch', 'dinner', 'snack', 'tea'];
const blurbs = ['From jianbing to eggs Benedict.', 'Rice bowls, noodles, and regional favorites.', 'Home-style dishes and dinner classics.', 'Skewers, street snacks, and sweets.', 'Explore real menus from 12 tea brands.'];
const icon = name => '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">' + symbols[name] + '</svg>';
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const button = (label, action, value = '', primary = false) => '<button class="button ' + (primary ? 'primary' : 'secondary') + '" data-action="' + action + '" data-value="' + escape(value) + '">' + label + '</button>';
const link = (label, to, primary = false) => '<a class="button ' + (primary ? 'primary' : 'secondary') + '" href="#' + to + '">' + label + '</a>';
const checked = value => value ? ' checked' : '';
const count = (number, label) => number + ' ' + label + (number === 1 ? '' : 's');
const categoryLink = category => category === 'Milk Tea' ? 'tea' : 'roulette/' + category.toLowerCase().split(' ').join('-');
const heading = (title, subtitle, actions = '') => '<div class="page-heading"><div><h1>' + title + '</h1><p class="lede">' + subtitle + '</p></div>' + (actions ? '<div class="actions">' + actions + '</div>' : '') + '</div>';
const option = (value, label, selected) => '<option value="' + escape(value) + '"' + (selected ? ' selected' : '') + '>' + escape(label) + '</option>';
const statusLabel = value => ({'menu-listed':'Menu listed', regional:'Regional listing', seasonal:'Seasonal release', archived:'Archived', unavailable:'Unavailable'})[value] ?? 'Availability unconfirmed';
const activePlanCategories = () => categories.filter(category => category === 'Milk Tea' ? state.includeTea : category !== 'Late-night Snack' || state.includeSnack);
let current = {page:'', category:'Breakfast'};
let spinning = null;
let frame = null;
let teaSearch = '';
let teaType = '';
let teaLimit = 24;
let library = 'saved';
let toastTimer;
let dialogTrigger;

function route() {
  const [page, slug] = location.hash.slice(1).split('/');
  return {page: Object.hasOwn(routes, page) ? page : 'home', category: categories.slice(0,4).find(category => categoryLink(category).endsWith('/' + slug)) ?? 'Breakfast'};
}

function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toastTimer = setTimeout(() => { toast.textContent = ''; }, 4500);
}

function persist(message) {
  const saved = saveState(storage, state);
  if (!saved) notify('Local storage is unavailable. Changes are saved for this session.');
  else if (message) notify(message);
}

function home() {
  const foodCount = categories.slice(0,4).reduce((sum, category) => sum + catalog[category].length, 0);
  return '<section class="hero card"><div class="hero-content"><h1>What are we<br class="hero-break"> eating today?</h1><p class="lede">Let the wheel decide.</p><div class="actions">' +
    link(icon('roulette') + ' Open food roulette', 'roulette/breakfast', true) +
    button(icon('shuffle') + ' Random All', 'random-all') +
    '</div></div><div class="hero-art" aria-hidden="true"><div class="plate-mat"><div class="plate"><div class="plate-inner">' + icon('lunch') +
    '</div></div><i class="fork"></i><i class="knife"></i></div></div></section>' +
    '<section class="home-categories" aria-labelledby="category-heading"><div class="section-heading"><h2 id="category-heading">Choose a wheel</h2><p>' + foodCount + ' dishes and ' + catalog['Milk Tea'].length + ' branded products</p></div><div class="category-grid">' +
    categories.map((category, i) => '<a class="card category-card tone-' + i + '" href="#' + categoryLink(category) + '"><span class="tile-icon">' + icon(categoryIcons[i]) + '</span><h3>' + category + '</h3><p>' + blurbs[i] + '</p><span class="category-count">' + catalog[category].length + ' ' + (i === 4 ? 'products' : 'dishes') + icon('arrow') + '</span></a>').join('') + '</div></section>';
}

function tile(item, subtitle = '', compact = false) {
  return '<article class="list-tile ' + (compact ? '' : 'card') + '"><div><button class="text-button item-title" data-action="details" data-value="' + item.id + '">' + escape(item.name) + '</button><p class="muted">' + escape(subtitle || (item.brand ? item.brand + ' · ' + item.productCategory : item.cuisine)) + '</p></div>' +
    '<button class="icon-button heart" title="' + (state.favorites.includes(item.id) ? 'Remove favorite' : 'Save favorite') + '" aria-label="' + (state.favorites.includes(item.id) ? 'Remove ' : 'Save ') + escape(item.name) + (state.favorites.includes(item.id) ? ' from favorites' : ' to favorites') + '" aria-pressed="' + state.favorites.includes(item.id) + '" data-action="favorite" data-value="' + item.id + '">' + icon('favorites') + '</button></article>';
}

function wheelPanel(category) {
  const pool = eligible(category, state);
  const previous = byId.get(state.last[category]);
  const visibleResult = previous && pool.some(item => item.id === previous.id) ? previous : null;
  const hasFrame = frame?.category === category && (!visibleResult || frame.result === visibleResult.id || spinning === frame) && frame.segments.every(item => pool.some(candidate => candidate.id === item.id));
  const preview = visibleResult ? [visibleResult, ...shuffle(pool.filter(item => item.id !== visibleResult.id)).slice(0, 7)] : shuffle(pool).slice(0, 8);
  const selection = hasFrame ? frame : {category, segments:preview, angle: preview.length ? -180 / preview.length : 0, result:visibleResult?.id};
  frame = selection;
  const busy = spinning?.category === category;
  const result = busy ? null : visibleResult;
  return '<section class="card wheel-panel" aria-label="' + category + ' roulette">' +
    '<div class="wheel-wrap"><div class="wheel-shell"><span class="pointer" aria-hidden="true"></span><canvas id="wheel" width="840" height="840" aria-label="Wheel segments: ' +
    escape(selection.segments.map(item => item.name).join(', ')) + '" role="img"></canvas><span class="wheel-hub" aria-hidden="true">' + icon(categoryIcons[categories.indexOf(category)]) + '</span></div></div>' +
    '<div class="wheel-copy"><span class="pill">' + count(pool.length, 'eligible option') + '</span><h2>' + category + ' wheel</h2><p class="lede">Each spin draws from the full eligible pool.</p>' +
    '<div class="result" id="result" aria-live="polite">' + (result ? '<p class="eyebrow">LAST PICK</p><h3>' + escape(result.name) + '</h3><p class="muted">' + escape(result.brand || result.cuisine) + '</p>' :
    '<p class="muted">' + (busy ? 'Spinning…' : pool.length ? 'Ready when you are.' : 'No eligible items. Try another brand or review your preferences and exclusions.') + '</p>') + '</div>' +
    '<div class="actions"><button id="spin" class="button primary" data-action="spin" data-value="' + category + '"' + (pool.length && !spinning ? '' : ' disabled') + '>' +
    icon('roulette') + (previous ? ' Spin Again' : ' Spin the Wheel') + '</button>' +
    (result ? button('Details', 'details', result.id) + button('Exclude', 'exclude', result.id) + button(state.favorites.includes(result.id) ? 'Saved' : 'Save', 'favorite', result.id) : '') +
    (pool.length ? '' : link('Preferences', 'preferences')) + '</div></div></section>';
}

function roulette() {
  return heading('Food Roulette', 'Pick a meal and give the wheel a spin.', button(icon('shuffle') + ' Random All', 'random-all')) +
    '<nav class="segmented" aria-label="Meal wheels">' + categories.map(category => '<a href="#' + categoryLink(category) + '"' + (category === current.category ? ' aria-current="page"' : '') + '>' + category + '</a>').join('') +
    '</nav>' + wheelPanel(current.category) + '<details class="card pool"><summary>Browse eligible dishes</summary><div class="list">' +
    eligible(current.category, state).map(item => tile(item, '', true)).join('') + '</div></details>';
}

function tea() {
  const brandOptions = option('', 'All brands', !state.brand) + brands.map(brand => option(brand.name, brand.name, brand.name === state.brand)).join('');
  const teaCategories = [...new Set(catalog['Milk Tea'].map(item => item.productCategory))].sort();
  return heading('Milk Tea Explorer', 'Browse bilingual menus, choose a brand, or let the wheel pick.') +
    '<section class="card toolbar"><label>Choose a brand<select id="brand">' + brandOptions + '</select></label>' + button(icon('shuffle') + ' Random Brand', 'random-brand') + '</section>' +
    wheelPanel('Milk Tea') +
    '<section class="tea-menu"><div class="section-heading"><h2>' + escape(state.brand || 'All brands') + ' menu</h2><p>Availability varies by store and season.</p></div>' +
    '<div class="card toolbar menu-toolbar"><label>Find a product<input type="search" id="tea-search" placeholder="Name, brand, or ingredient" value="' + escape(teaSearch) + '"></label><label>Product type<select id="tea-type">' +
    option('', 'All types', !teaType) + teaCategories.map(type => option(type, type, teaType === type)).join('') + '</select></label></div><div id="tea-items"></div></section>';
}

function renderTeaItems() {
  const container = document.querySelector('#tea-items');
  if (!container) return;
  const query = normalize(teaSearch);
  const products = catalog['Milk Tea'].filter(item => (!state.brand || item.brand === state.brand) && (!teaType || item.productCategory === teaType) && (!query || searchable(item).includes(query)));
  container.innerHTML = '<p class="list-count" aria-live="polite">' + count(products.length, 'product') + '</p>' +
    (products.length ? '<div class="tile-grid">' + products.slice(0, teaLimit).map(item => tile(item, item.brand + ' · ' + item.productCategory + ' · ' + statusLabel(item.availability))).join('') + '</div>' : '<p class="card empty">No matching menu products.</p>') +
    (products.length > teaLimit ? '<div class="actions">' + button('Show more products', 'tea-more') + '</div>' : '');
}

function plan() {
  const hasPlan = Object.keys(state.plan).length > 0;
  return heading('Daily Meal Plan', 'One pick for each meal, with room for a snack and milk tea.',
    button(icon('shuffle') + (hasPlan ? ' Regenerate All' : ' Generate My Day'), 'generate', '', true)) +
    '<section class="card toolbar plan-options" aria-label="Optional meals"><label class="check"><input type="checkbox" id="includeSnack"' + checked(state.includeSnack) + '> Include late-night snack</label><label class="check"><input type="checkbox" id="includeTea"' + checked(state.includeTea) + '> Include milk tea</label></section>' +
    '<div class="plan-grid">' + activePlanCategories().map(category => {
      const pool = eligible(category, state);
      const item = pool.find(candidate => candidate.id === state.plan[category]);
      const i = categories.indexOf(category);
      return '<section class="card plan-card tone-' + i + '"><span class="tile-icon">' + icon(categoryIcons[i]) + '</span><h2>' + category + '</h2>' +
        (item ? tile(item, '', true) : '<p class="muted">' + (pool.length ? 'Ready to generate.' : 'No eligible options.') + '</p>') +
        '<div class="actions">' + (pool.length ? button(item ? 'Regenerate' : 'Generate', 'generate-one', category) : link('Preferences', 'preferences')) + '</div></section>';
    }).join('') + '</div>';
}

function favorites() {
  const history = library === 'history';
  const records = history ? state.history : state.favorites.map(id => ({id}));
  return heading('Favorites', 'Save something for later or revisit past picks.', history && records.length ? button('Clear History', 'confirm-history') : '') +
    '<div class="segmented" aria-label="Collection views">' + ['saved','history'].map(key => '<button aria-pressed="' + (library === key) + '" data-action="library" data-value="' + key + '">' + (key === 'saved' ? 'Saved items' : 'History') + '</button>').join('') + '</div>' +
    (records.length ? '<div class="tile-grid">' + records.map(entry => {
      const item = byId.get(entry.id);
      const subtitle = history ? [item.brand || item.category, new Date(entry.at).toLocaleString('en', {dateStyle:'medium', timeStyle:'short'})].join(' · ') : '';
      return tile(item, subtitle);
    }).join('') + '</div>' : '<p class="card empty">' + (history ? 'Your past roulette and meal plan picks will appear here.' : 'Save a dish or a drink to see it here.') + '</p>');
}

function settings() {
  const choices = (values, field) => values.map(value => '<label class="check"><input type="checkbox" data-setting="' + field + '" value="' + escape(value) + '"' + checked(state[field].includes(value)) + '>' + escape(value) + '</label>').join('');
  return heading('Preferences', 'Set what you like and what to leave out.') +
    '<div class="settings-grid"><fieldset class="card settings-card"><legend>Food preferences</legend><p class="muted">Matching foods are prioritized when available.</p><div class="check-grid">' +
    '<label class="check"><input type="checkbox" id="no-preference"' + checked(!state.preferences.length) + '> No Preference</label>' +
    choices(preferences, 'preferences') + '</div></fieldset><fieldset class="card settings-card"><legend>Food restrictions</legend><p class="muted">Seafood, egg, dairy, and peanut filters require a complete verified ingredient declaration. The catalog currently has recipe summaries and partial menu information.</p><div class="check-grid">' +
    choices(restrictions, 'restrictions') + '</div></fieldset><form class="card settings-card" id="custom-form"><h2>Custom restrictions</h2><label for="custom">Foods or ingredients to avoid</label><textarea id="custom" rows="3" maxlength="1000" placeholder="Separate entries with commas or new lines">' + escape(state.custom) +
    '</textarea><div class="actions"><button class="button primary" type="submit">Save restrictions</button></div></form><section class="card settings-card"><h2>Excluded items</h2>' +
    (state.excluded.length ? '<ul class="exclusions">' + state.excluded.map(id => {
      const item = byId.get(id);
      return '<li><span>' + escape(item.name) + (item.brand ? ' · ' + escape(item.brand) : '') + '</span>' + button('Restore', 'restore', id) + '</li>';
    }).join('') + '</ul>' : '<p class="muted">Items you exclude from a wheel or product detail appear here.</p>') + '</section></div>';
}

const pages = {home, roulette, plan, tea, favorites, preferences:settings};
function render({navigate = false, refocus} = {}) {
  navigation.innerHTML = Object.entries(routes).map(([page, title]) => '<a href="#' + page + '"' + (page === current.page ? ' aria-current="page"' : '') + '>' + icon(page) + '<span>' + title + '</span></a>').join('');
  main.innerHTML = pages[current.page]();
  document.title = current.page === 'home' ? 'What to Eat' : routes[current.page] + ' · What to Eat';
  if (current.page === 'tea') renderTeaItems();
  const canvas = document.querySelector('#wheel');
  if (canvas && frame) {
    paintWheel(canvas, frame.segments);
    canvas.style.transform = 'rotate(' + frame.angle + 'deg)';
  }
  if (navigate) {
    window.scrollTo(0, 0);
    main.focus({preventScroll:true});
    main.classList.remove('arrive');
    requestAnimationFrame(() => main.classList.add('arrive'));
  } else if (refocus) {
    document.querySelector(refocus)?.focus({preventScroll:true});
  }
}
function syncRoute() {
  if (location.hash === '#main') return;
  const next = route();
  if (current.page === next.page && current.category === next.category) return;
  if (dialog.open) dialog.close();
  current = next;
  frame = null;
  render({navigate:true});
}
window.addEventListener('hashchange', syncRoute);

function paintWheel(canvas, segments) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const center = canvas.width / 2;
  const radius = center - 7;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(center, center);
  if (!segments.length) {
    ctx.fillStyle = '#eeeae2';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fill();
  }
  const colors = ['#e4e9e8','#f3eee3','#e3e9e0','#ece3d7','#dce5ea','#f1eadc','#e6e8e0','#e8ded3'];
  const arc = 2 * Math.PI / segments.length;
  for (let i = 0; i < segments.length; i += 1) {
    const start = i * arc - Math.PI / 2;
    const middle = start + arc / 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, start + arc);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    ctx.strokeStyle = '#fffdf8';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.save();
    ctx.rotate(middle);
    const flipped = Math.cos(middle) < 0;
    ctx.translate(radius * 0.72, 0);
    if (flipped) ctx.rotate(Math.PI);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#294253';
    ctx.font = '650 30px system-ui, sans-serif';
    const lines = [];
    let line = '';
    for (const word of segments[i].name.split(' ')) {
      const next = line ? line + ' ' + word : word;
      if (ctx.measureText(next).width > 170 && line) { lines.push(line); line = word; }
      else line = next;
    }
    lines.push(line);
    lines.forEach((value, index) => ctx.fillText(value, 0, (index - (lines.length - 1) / 2) * 34, 176));
    ctx.restore();
  }
  ctx.restore();
}

async function spin(category) {
  if (spinning) return;
  const draw = wheelDraw(eligible(category, state), state.last[category]);
  if (!draw.result) return;
  const angle = stopAngle(draw.index, draw.segments.length);
  frame = {category, segments: draw.segments, angle:0, result:draw.result.id};
  spinning = frame;
  const task = spinning;
  render({refocus:'#spin'});
  const canvas = document.querySelector('#wheel');
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 2750;
  if (canvas?.animate && duration) {
    const animation = canvas.animate([{transform:'rotate(0deg)'}, {transform:'rotate(' + angle + 'deg)'}], {duration, easing:'cubic-bezier(.12,.7,.15,1)', fill:'forwards'});
    try { await animation.finished; } catch { /* The route may have changed. */ }
  }
  if (spinning !== task) return;
  spinning = null;
  if (eligible(category, state).some(item => item.id === draw.result.id)) {
    record(state, draw.result);
    persist();
  }
  if (frame === task) frame.angle = angle;
  if (current.page === 'roulette' || current.page === 'tea') {
    const focused = document.activeElement;
    const refocus = focused?.id ? '#' + CSS.escape(focused.id) : undefined;
    render({refocus});
  }
}

function generate(targets) {
  let total = 0;
  for (const category of targets) {
    const draw = wheelDraw(eligible(category, state), state.plan[category] || state.last[category]);
    if (!draw.result) { delete state.plan[category]; continue; }
    state.plan[category] = draw.result.id;
    record(state, draw.result);
    total += 1;
  }
  persist(total ? count(total, 'meal pick') + ' generated.' : 'No eligible items to generate.');
}

function showDialog(html, trigger) {
  if (!dialog.open) dialogTrigger = trigger;
  dialog.innerHTML = html;
  if (!dialog.open) dialog.showModal();
}
dialog.addEventListener('close', () => {
  if (dialogTrigger?.isConnected) dialogTrigger.focus({preventScroll:true});
  else if (dialogTrigger?.dataset.action === 'details') {
    const match = document.querySelector('[data-action="details"][data-value="' + dialogTrigger.dataset.value + '"]');
    (match ?? main).focus({preventScroll:true});
  }
  dialogTrigger = null;
});
function detail(item, trigger) {
  const identity = [item.brand || item.cuisine, item.productCategory || item.category].filter(Boolean).join(' · ');
  const ingredients = item.ingredients.length ? item.ingredients.join(', ') : 'Ingredient information unavailable.';
  const evidence = {'typical-recipe':'Typical recipe ingredients', 'published-highlights':'Published ingredient highlights', unknown:'Ingredient information', 'verified-complete':'Verified ingredient declaration'}[item.ingredientEvidence];
  const price = item.price ? new Intl.NumberFormat('en', {style:'currency', currency:item.price.currency}).format(item.price.amount) : 'Price unavailable';
  showDialog('<div class="dialog-head"><div><p class="eyebrow">' + escape(identity) + '</p><h2 id="detail-title">' + escape(item.name) + '</h2>' +
    (item.brand && item.nameChinese ? '<p lang="zh" class="muted">' + escape(item.nameChinese) + '</p>' : '') + '</div><button class="icon-button" data-action="close" aria-label="Close details">×</button></div>' +
    '<div class="dialog-body"><h3>' + evidence + '</h3><p>' + escape(ingredients) + '</p><h3>Recorded allergens</h3><p>' + escape(item.allergens.join(', ') || 'Unavailable') + '</p>' +
    (item.ingredientEvidence !== 'verified-complete' ? '<p class="muted">Ingredient and cross-contact information is incomplete.</p>' : '') +
    (item.brand ? '<h3>Menu reference</h3><p>' + escape(statusLabel(item.availability) + ' · ' + item.market + ' · ' + price) + '</p><p>Checked ' + escape(item.lastVerified) + ' · <a href="' + escape(item.source) + '" target="_blank" rel="noopener noreferrer">View source</a></p>' : '') +
    '</div><div class="dialog-actions">' + button(state.favorites.includes(item.id) ? 'Remove Favorite' : 'Save Favorite', 'favorite', item.id, true) +
    button(state.excluded.includes(item.id) ? 'Restore to Wheel' : 'Exclude from Wheel', state.excluded.includes(item.id) ? 'restore' : 'exclude', item.id) + '</div>', trigger);
}
function toggle(list, value) {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}
function rerenderAction(control) {
  const {action, value} = control.dataset;
  const id = value ? '[data-value="' + CSS.escape(value) + '"]' : '';
  render({refocus:'[data-action="' + action + '"]' + id});
}

document.addEventListener('click', event => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const {action, value} = control.dataset;
  if (action === 'spin') { void spin(value); return; }
  if (action === 'details') { detail(byId.get(value), control); return; }
  if (action === 'close') { dialog.close(); return; }
  if (action === 'confirm-history') {
    showDialog('<div class="dialog-head"><h2 id="detail-title">Clear history?</h2></div><div class="dialog-body"><p>Remove all past picks from this device.</p></div><div class="dialog-actions">' +
      button('Cancel', 'close') + button('Clear History', 'clear-history', '', true) + '</div>', control);
    return;
  }
  if (action === 'tea-more') {
    const index = teaLimit;
    teaLimit += 24;
    renderTeaItems();
    document.querySelectorAll('#tea-items .item-title')[index]?.focus();
    return;
  }
  if (action === 'random-all') { state.includeSnack = true; state.includeTea = true; generate(categories); location.hash = 'plan'; return; }
  if (action === 'generate') generate(activePlanCategories());
  if (action === 'generate-one') generate([value]);
  if (action === 'library') library = value;
  if (action === 'clear-history') { dialog.close(); state.history = []; persist('History cleared.'); }
  if (action === 'random-brand') {
    const available = [...new Set(eligible('Milk Tea', state, '').filter(menuEligible).map(item => item.brand))];
    const other = available.filter(brand => brand !== state.brand);
    if (!available.length) { notify('No brands match your restrictions.'); return; }
    state.brand = shuffle(other.length ? other : available)[0];
    frame = null; teaLimit = 24;
    persist(state.brand + ' selected.');
  }
  if (action === 'favorite') {
    state.favorites = toggle(state.favorites, value);
    persist(state.favorites.includes(value) ? 'Saved to favorites.' : 'Removed from favorites.');
  }
  if (action === 'exclude' || action === 'restore') {
    state.excluded = action === 'exclude' ? [...new Set([...state.excluded, value])] : state.excluded.filter(id => id !== value);
    if (action === 'exclude') {
      for (const category of categories) {
        if (state.plan[category] === value) delete state.plan[category];
        if (state.last[category] === value) delete state.last[category];
      }
    }
    frame = null;
    persist(action === 'exclude' ? 'Excluded from the wheels.' : 'Restored to the wheels.');
  }
  if (dialog.open) {
    render();
    detail(byId.get(value), dialogTrigger);
    dialog.querySelector(action === 'favorite' ? '[data-action="favorite"]' : '.dialog-actions .secondary')?.focus();
  } else rerenderAction(control);
});

main.addEventListener('input', event => {
  if (event.target.id !== 'tea-search') return;
  teaSearch = event.target.value;
  teaLimit = 24;
  renderTeaItems();
});
main.addEventListener('change', event => {
  const input = event.target;
  if (input.id === 'tea-type') { teaType = input.value; teaLimit = 24; renderTeaItems(); return; }
  if (input.id === 'brand') { state.brand = input.value; frame = null; teaLimit = 24; }
  else if (input.id === 'includeTea' || input.id === 'includeSnack') state[input.id] = input.checked;
  else if (input.id === 'no-preference') {
    if (!input.checked) { input.checked = true; return; }
    state.preferences = [];
  } else if (input.dataset.setting) {
    state[input.dataset.setting] = toggle(state[input.dataset.setting], input.value);
  } else return;
  persist(input.id === 'brand' ? undefined : 'Preferences saved.');
  render({refocus:input.id ? '#' + input.id : '[data-setting="' + input.dataset.setting + '"][value="' + CSS.escape(input.value) + '"]'});
});
main.addEventListener('submit', event => {
  if (event.target.id !== 'custom-form') return;
  event.preventDefault();
  state.custom = document.querySelector('#custom').value.trim();
  persist('Custom restrictions saved.');
});
syncRoute();
