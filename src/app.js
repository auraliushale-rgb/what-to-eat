import { namesZh, ingredientsZh } from './catalog-zh.js';
import heroImage from './home-menu.jpeg';
import supportCode from './support-qr.jpg';
import { translate, localize, celebrate } from './interface.js';
import { brands, items, byId, catalog, categories, eligible, menuEligible, preferences, restrictions, searchable, normalize, shuffle, stopAngle, wheelDraw } from './catalog.js';
import { loadState, record, saveState } from './state.js';

const main = document.querySelector('main');
const navigation = document.querySelector('#navigation');
const toast = document.querySelector('#toast');
const dialog = document.querySelector('#details');
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const state = loadState(storage);
const projectInfo = document.createElement('button');
projectInfo.type = 'button';
projectInfo.className = 'text-button';
projectInfo.dataset.action = 'project-info';
document.querySelector('#support-project').after(projectInfo);

let language = 'en';
function interfaceMotion() {
  const style = getComputedStyle(document.documentElement);
  return {
    duration: Number(style.getPropertyValue('--motion-ms')),
    easing: style.getPropertyValue('--motion-easing').trim()
  };
}
let languageAnimation;
try { if (storage?.getItem('what-to-eat:language') === 'zh') language = 'zh'; } catch {}
const copy = (en, zh) => language === 'zh' ? zh : en;
const extraLabels = {'Chinese Home Cooking':'家常菜', 'Ice Cream':'冰淇淋', Other:'其他', Me:'我'};
const t = value => language === 'zh' && extraLabels[value] ? extraLabels[value] : translate(value, language);
const brandName = name => language === 'zh' ? brands.find(brand => brand.name === name)?.nameChinese || name : name;
const regionLabel = item => {
  if (item.availability !== 'regional') return '';
  const region = copy(item.region, item.regionChinese);
  return region ? copy('Regional exclusive: ', '区域限定：') + region :
    copy('Regional exclusive · Location not specified', '区域限定 · 文档未注明地区');
};
const withRegion = (label, item) => [label, regionLabel(item)].filter(Boolean).join(' · ');
const cuisineCorrections = {
  "Ye'abesha Gomen":'Ethiopian', 'Tikil Gomen':'Ethiopian', 'Spiced Cauliflower':'Ethiopian',
  'Roasted Cauliflower':'Nordic', Kimchi:'Korean', Coleslaw:'American',
  Pozole:'Mexican', Cilantro:'Mexican', 'Arroz Rojo':'Mexican'
};
const cuisineOf = item => cuisineCorrections[item.cuisine] || item.cuisine;
const groupsOf = item => [item.productCategory || cuisineOf(item), ...(item.cuisineAliases || [])];
const homeGroup = category => ['Breakfast','Lunch','Dinner'].includes(category) ? 'Chinese Home Cooking' : '';
const itemName = item => language === 'zh' ? (namesZh[item.id] || item.nameChinese || item.name) : item.name;
let subgroup = '';
const subtype = item => item.productCategory || cuisineOf(item);
const wheelPool = category => eligible(category, state).filter(item => !subgroup || groupsOf(item).includes(subgroup));
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
const categoryLink = category => category === 'Milk Tea' ? 'roulette/milk-tea' : 'roulette/' + category.toLowerCase().split(' ').join('-');
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
  if (page === 'tea') return {page:'roulette', category:'Milk Tea'};
  return {page: page === 'me' ? 'me' : Object.hasOwn(routes, page) ? page : 'home', category: categories.find(category => categoryLink(category).endsWith('/' + slug)) ?? 'Breakfast'};
}

function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = t(message);
  toastTimer = setTimeout(() => { toast.textContent = ''; }, 4500);
}

function persist(message) {
  const saved = saveState(storage, state);
  if (!saved) notify('Local storage is unavailable. Changes are saved for this session.');
  else if (message) notify(message);
}

function home() {
  const foodCount = items.filter(item => !item.brand).length;
  return '<section class="hero card"><div class="hero-content"><h1>What are we<br class="hero-break"> eating today?</h1><p class="lede">Let the wheel decide.</p><div class="actions">' +
    link(icon('roulette') + ' Open food roulette', 'roulette/breakfast', true) +
    button(icon('shuffle') + ' Random All', 'random-all') +
    '</div></div><div class="hero-art"><img src="' + heroImage + '" alt="' + copy('Illustrated food menu','美食菜单插图') + '"></div></section>' +
    '<section class="home-categories" aria-labelledby="category-heading"><div class="section-heading"><h2 id="category-heading">Choose a wheel</h2><p>' + foodCount + ' dishes and ' + catalog['Milk Tea'].length + ' branded products</p></div><div class="category-grid">' +
    categories.map((category, i) => '<a class="card category-card tone-' + i + '" href="#' + categoryLink(category) + '"><span class="tile-icon">' + icon(categoryIcons[i]) + '</span><h3>' + category + '</h3><p>' + blurbs[i] + '</p><span class="category-count">' + catalog[category].length + ' ' + (i === 4 ? 'products' : 'dishes') + icon('arrow') + '</span></a>').join('') + '</div></section>';
}

function tile(item, subtitle = '', compact = false) {
  return '<article class="list-tile ' + (compact ? '' : 'card') + '"><div><strong class="item-title">' + escape(itemName(item)) + '</strong><p class="muted">' + escape(withRegion(subtitle || (item.brand ? brandName(item.brand) + ' · ' + t(item.productCategory) : t(cuisineOf(item))), item)) + '</p></div>' +
    '<button class="icon-button heart" title="' + (state.favorites.includes(item.id) ? 'Remove favorite' : 'Save favorite') + '" aria-label="' + escape(t(state.favorites.includes(item.id) ? 'Remove favorite' : 'Save favorite') + ' · ' + itemName(item)) + '" aria-pressed="' + state.favorites.includes(item.id) + '" data-action="favorite" data-value="' + item.id + '">' + icon('favorites') + '</button></article>';
}

function grouped(items) {
  const groups = new Map();
  for (const item of items) {
    for (const key of subgroup && !item.brand ? [subgroup] : groupsOf(item)) {
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
  }
  return [...groups].sort(([a],[b]) => t(a).localeCompare(t(b),language)).map(([group, entries]) => '<details class="food-group"><summary>' + escape(t(group)) + ' <span>' + entries.length + '</span></summary>' + entries.map(item => tile(item, '', true)).join('') + '</details>').join('');
}

function wheelPanel(category) {
  const pool = wheelPool(category);
  const groups = [...new Set(eligible(category, state).flatMap(groupsOf))].sort((a,b) => t(a).localeCompare(t(b),language));
  const previous = pool.find(item => item.id === state.last[category]);
  const visibleResult = previous && pool.some(item => item.id === previous.id) ? previous : null;
  const hasFrame = frame?.category === category && (!visibleResult || frame.result === visibleResult.id || spinning === frame) && frame.segments.every(item => pool.some(candidate => candidate.id === item.id));
  const preview = visibleResult ? [visibleResult, ...shuffle(pool.filter(item => item.id !== visibleResult.id)).slice(0, 7)] : shuffle(pool).slice(0, 8);
  const selection = hasFrame ? frame : {category, segments:preview, angle: preview.length ? -180 / preview.length : 0, result:visibleResult?.id};
  frame = selection;
  const busy = spinning?.category === category;
  const result = busy ? null : visibleResult;
  return '<section class="card wheel-panel" aria-label="' + escape(copy(category + ' roulette', t(category) + '转盘')) + '">' +
    '<div class="wheel-wrap"><div class="wheel-shell"><span class="pointer" aria-hidden="true"></span><canvas id="wheel" width="840" height="840" aria-label="' + t('Wheel segments') + ': ' +
    escape(selection.segments.map(itemName).join(', ')) + '" role="img"></canvas><span class="wheel-hub" aria-hidden="true">' + icon(categoryIcons[categories.indexOf(category)]) + '</span></div></div>' +
    '<div class="wheel-copy"><label class="wheel-filter">' + t(category === 'Milk Tea' ? 'Product type' : 'Cuisine') + '<select id="wheel-group"' + (spinning ? ' disabled' : '') + '>' + option('', t('All types'), !subgroup) + groups.map(group => option(group,t(group),subgroup === group)).join('') + '</select></label><span class="pill">' + count(pool.length, 'eligible option') + '</span><h2>' + category + ' wheel</h2><p class="lede">Choose a category, then spin.</p>' +
    '<div class="result" id="result" aria-live="polite">' + (result ? '<p class="eyebrow">LAST PICK</p><h3>' + escape(itemName(result)) + '</h3><p class="muted">' + escape(withRegion(result.brand ? brandName(result.brand) : t(cuisineOf(result)), result)) + '</p>' :
    '<p class="muted">' + (busy ? 'Spinning…' : pool.length ? 'Ready when you are.' : 'No eligible items. Try another brand or review your preferences and exclusions.') + '</p>') + '</div>' +
    '<div class="actions"><button id="spin" class="button primary" data-action="spin" data-value="' + category + '"' + (pool.length && !spinning ? '' : ' disabled') + '>' +
    icon('roulette') + (previous ? ' Spin Again' : ' Spin the Wheel') + '</button>' +
    (result ? button(copy('Add to menu','加入菜单'), 'add-menu', result.id) + button('Exclude', 'exclude', result.id) + button(state.favorites.includes(result.id) ? 'Saved' : 'Save', 'favorite', result.id) : '') +
    (pool.length ? '' : link('Preferences', 'preferences')) + '</div></div></section>';
}

function roulette() {
  const tabs = categories.map(category => '<a class="' + (category === 'Milk Tea' ? 'tea-nav' : '') +
    '" href="#' + categoryLink(category) + '"' + (category === current.category ? ' aria-current="page"' : '') +
    '>' + (category === 'Milk Tea' ? copy('Milk Tea Explorer','奶茶专区') : t(category)) + '</a>').join('');
  return heading('Food Roulette', 'Pick a meal and give the wheel a spin.', button(icon('shuffle') + ' Random All', 'random-all')) +
    '<nav class="segmented wheel-tabs" aria-label="Meal wheels">' + tabs + '</nav>' +
    (current.category === 'Milk Tea' ? tea() : wheelPanel(current.category) +
      '<details class="card pool"><summary>Browse eligible dishes</summary><div class="list">' +
      grouped(wheelPool(current.category)) + '</div></details>');
}

function tea() {
  const brandOptions = option('', 'All brands', !state.brand) + brands.map(brand => option(brand.name, brandName(brand.name), brand.name === state.brand)).join('');
  const teaCategories = [...new Set(catalog['Milk Tea'].map(item => item.productCategory))].sort();
  return '<section class="card toolbar"><label>Choose a brand<select id="brand">' + brandOptions + '</select></label>' + button(icon('shuffle') + ' Random Brand', 'random-brand') + '</section>' +
    wheelPanel('Milk Tea') +
    '<section class="tea-menu"><div class="section-heading"><h2>' + escape(state.brand ? brandName(state.brand) : 'All brands') + ' menu</h2><p>Availability varies by store and season.</p></div>' +
    '<div class="card toolbar menu-toolbar"><label>Find a product<input type="search" id="tea-search" placeholder="Name, brand, or region" value="' + escape(teaSearch) + '"></label><label>Product type<select id="tea-type">' +
    option('', 'All types', !teaType) + teaCategories.map(type => option(type, t(type), teaType === type)).join('') + '</select></label></div><div id="tea-items"></div></section>';
}

function renderTeaItems() {
  const container = document.querySelector('#tea-items');
  if (!container) return;
  const query = normalize(teaSearch);
  const products = [...catalog['Milk Tea']].sort((a,b) => subtype(a).localeCompare(subtype(b))).filter(item => (!state.brand || item.brand === state.brand) && (!teaType || item.productCategory === teaType) && (!query || (searchable(item).includes(query) || normalize(itemName(item)).includes(query) || normalize(brandName(item.brand)).includes(query) || normalize(item.region || '').includes(query) || normalize(item.regionChinese || '').includes(query))));
  container.innerHTML = '<p class="list-count" aria-live="polite">' + count(products.length, 'product') + '</p>' +
    (products.length ? '<div class="tile-grid">' + grouped(products.slice(0, teaLimit)) + '</div>' : '<p class="card empty">No matching menu products.</p>') +
    (products.length > teaLimit ? '<div class="actions">' + button('Show more products', 'tea-more') + '</div>' : '');
  localize(container, language);
}

const plannedIds = category => state.plan[category] || [];
function removeFromMenu(id, meals = categories) {
  for (const meal of meals) {
    const ids = plannedIds(meal).filter(pick => pick !== id);
    if (ids.length) state.plan[meal] = ids;
    else delete state.plan[meal];
  }
}
function plan() {
  const clear = Object.keys(state.plan).length ? button(copy('Clear menu','清空菜单'), 'clear-menu') : '';
  return heading('Daily Meal Plan', copy('Use + to open the wheel for each meal.', '点击「＋」前往对应转盘添加。'), clear) +
    '<div class="plan-grid">' + categories.map(category => {
      const add = copy('Add to ','添加到') + t(category);
      const picks = plannedIds(category).map(id => {
        const item = catalog[category].find(entry => entry.id === id);
        return '<li><span>' + escape(withRegion(itemName(item), item)) + '</span><button class="icon-button" data-action="remove-menu" data-value="' +
          escape(id) + '" data-meal="' + escape(category) + '" aria-label="' + escape(copy('Remove ','移除') + itemName(item)) + '">×</button></li>';
      }).join('');
      return '<section class="card plan-card"><div class="plan-card-heading"><h2>' + t(category) +
        '</h2><a class="icon-button plan-add" href="#' + categoryLink(category) + '" aria-label="' + escape(add) +
        '">+</a></div>' + (picks ? '<ul class="exclusions">' + picks + '</ul>' : '<p class="muted">' +
        copy('No picks yet.','暂未添加。') + '</p>') +
        (picks ? button(copy('Clear this category','清空此分类'), 'clear-category', category) : '') + '</section>';
    }).join('') + '</div>';
}

let accountSection = 'saved';
function me() {
  const sections = [['saved',copy('My favorites','我的收藏')],['history',copy('History','历史记录')],['preferences',copy('Preferences','偏好设置')]];
  library = accountSection;
  return '<nav class="segmented account-nav" aria-label="' + copy('My account','我的栏目') + '">' + sections.map(([key,label]) =>
    '<button aria-pressed="' + (accountSection === key) + '" data-action="account-section" data-value="' + key + '">' + label + '</button>').join('') +
    '</nav><div class="arrive">' + (accountSection === 'preferences' ? settings() : favorites()) + '</div>';
}
function favorites() {
  const history = library === 'history';
  const records = history ? state.history : state.favorites.map(id => ({id}));
  return heading('Favorites', 'Save something for later or revisit past picks.', history && records.length ? button('Clear History', 'confirm-history') : '') +

    (records.length ? '<div class="tile-grid">' + records.map(entry => {
      const item = byId.get(entry.id);
      const subtitle = history ? [brandName(item.brand) || t(item.category), new Date(entry.at).toLocaleString(language, {dateStyle:'medium', timeStyle:'short'})].join(' · ') : '';
      return tile(item, subtitle);
    }).join('') + '</div>' : '<p class="card empty">' + (history ? 'Your past roulette and meal plan picks will appear here.' : 'Save a dish or a drink to see it here.') + '</p>');
}

function settings() {
  const choices = (values, field) => values.map(value => '<label class="check"><input type="checkbox" data-setting="' + field + '" value="' + escape(value) + '"' + checked(state[field].includes(value)) + '>' + escape(value) + '</label>').join('');
  return heading('Preferences', 'Set what you like and what to leave out.') +
    '<div class="settings-grid"><fieldset class="card settings-card"><legend>Food preferences</legend><p class="muted">Matching foods are prioritized when available.</p><div class="check-grid">' +
    '<label class="check"><input type="checkbox" id="no-preference"' + checked(!state.preferences.length) + '> No Preference</label>' +
    choices(preferences, 'preferences') + '</div></fieldset><fieldset class="card settings-card"><legend>Food restrictions</legend><p class="muted">' + copy('Ingredient information may be incomplete, so filters cannot guarantee that all restrictions are met.', '配料信息可能不完整，筛选结果无法保证满足所有饮食限制。') + '</p><div class="check-grid">' +
    choices(restrictions, 'restrictions') + button(copy('Custom','自定义'), 'custom') + '</div></fieldset><section class="card settings-card"><h2>Excluded items</h2>' +
    (state.excluded.length ? '<ul class="exclusions">' + state.excluded.map(id => {
      const item = byId.get(id);
      return '<li><span>' + escape(itemName(item)) + (item.brand ? ' · ' + escape(brandName(item.brand)) : '') + '</span>' + button('Restore', 'restore', id) + '</li>';
    }).join('') + '</ul>' : '<p class="muted">Items you exclude from a wheel or product detail appear here.</p>') + '</section></div>';
}

const pages = {home, roulette, plan, tea, favorites:me, preferences:me, me};
function enhanceSelects(root) {
  for (const select of root.querySelectorAll('select')) {
    if (select.hidden || select.disabled) continue;
    const field = document.createElement('details');
    field.className = 'site-select';
    const summary = document.createElement('summary');
    summary.textContent = select.selectedOptions[0]?.textContent || '';
    const panel = document.createElement('div');
    panel.className = 'site-select-panel';
    const choices = document.createElement('div');
    choices.className = 'site-select-options';
    for (const option of select.options) {
      const choice = document.createElement('button');
      choice.type = 'button';
      choice.textContent = option.textContent;
      choice.setAttribute('aria-pressed', String(option.selected));
      choice.addEventListener('click', event => {
        event.preventDefault();
        select.value = option.value;
        summary.textContent = option.textContent;
        for (const button of choices.children) button.setAttribute('aria-pressed', String(button === choice));
        closeChoices();
        select.dispatchEvent(new Event('change', {bubbles:true}));
        (summary.isConnected ? summary : document.getElementById(select.id)?.nextElementSibling?.querySelector('summary'))?.focus();
      });
      choices.append(choice);
    }
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'site-select-more';
    const moreLabel = copy('More options below ↓', '下方还有选项 ↓');
    more.hidden = true;
    const atBottom = () => choices.scrollHeight - choices.clientHeight - choices.scrollTop <= 2;
    const updateMore = () => {
      more.hidden = choices.scrollHeight - choices.clientHeight <= 2;
      more.textContent = atBottom() ? copy('Back to top ↑', '回到顶部 ↑') : moreLabel;
    };
    more.addEventListener('click', () => {
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      choices.scrollBy({top:atBottom() ? -choices.scrollTop : choices.clientHeight - 44, behavior:reducedMotion ? 'auto' : 'smooth'});
    });
    choices.addEventListener('scroll', updateMore, {passive:true});
    field.addEventListener('toggle', () => {
      if (field.open) updateMore();
    });
    panel.append(choices, more);
    let closing;
    function closeChoices() {
      if (!field.open || closing) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        field.open = false;
        return;
      }
      closing = panel.animate([{opacity:1, transform:'translateY(0)'}, {opacity:0, transform:'translateY(-4px)'}], interfaceMotion());
      closing.onfinish = () => { field.open = false; closing = null; };
    }
    summary.addEventListener('click', event => {
      if (!field.open) return;
      event.preventDefault();
      closeChoices();
    });
    field.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !field.open) return;
      event.preventDefault();
      event.stopPropagation();
      closeChoices();
      summary.focus();
    });
    field.append(summary, panel);
    select.hidden = true;
    select.after(field);
  }
}
function render({navigate = false, refocus} = {}) {
  const mainRoutes = ['home', 'roulette', 'plan', 'me'];
  const active = {tea:'roulette', favorites:'me', preferences:'me'}[current.page] || current.page;
  navigation.innerHTML = mainRoutes.map(page => '<a href="#' + page + '"' + (page === active ? ' aria-current="page"' : '') +
    '>' + icon(page === 'me' ? 'favorites' : page) + '<span>' + t(routes[page] || 'Me') + '</span></a>').join('');
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.querySelector('#language').setAttribute('aria-pressed', String(language === 'zh'));
  document.querySelector('.skip').textContent = t('Skip to content');
  navigation.setAttribute('aria-label', t('Main navigation'));
  main.innerHTML = pages[current.page]();
  document.querySelector('#project-credits').textContent = t('Credits');
  document.querySelector('#support-project').textContent = t('Support the project');
  projectInfo.textContent = language === 'zh' ? '项目说明' : 'About this project';
  localize(main, language);
  document.title = current.page === 'home' ? 'What to Eat' : t(routes[current.page] || 'Me') + ' · ' + 'What to Eat';
  if (current.page === 'roulette' && current.category === 'Milk Tea') renderTeaItems();
  enhanceSelects(main);
  const canvas = document.querySelector('#wheel');
  if (canvas && frame) {
    const segments = frame.segments;
    paintWheel(canvas, segments);
    if (language === 'zh' && document.fonts) {
      document.fonts.load('700 32px "Noto Serif SC"', segments.map(itemName).join('')).then(() => {
        if (canvas.isConnected && language === 'zh' && frame?.segments === segments) paintWheel(canvas, segments);
      }).catch(() => {});
    }
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
  const samePage = current.page === next.page;
  current = next;
  if (next.page === 'preferences') accountSection = 'preferences';
  if (next.page === 'favorites') accountSection = 'saved';
  subgroup = next.page === 'roulette' ? homeGroup(next.category) : '';
  frame = null;
  render({navigate:!samePage, refocus:samePage ? '.wheel-tabs [aria-current]' : undefined});
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
    ctx.font = '700 32px ' + (language === 'zh' ? '"Noto Serif SC", "Songti SC", STSong, SimSun, serif' : '"Times New Roman", serif');
    const lines = [];
    let line = '';
    for (const word of itemName(segments[i]).split(' ')) {
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
  const draw = wheelDraw(wheelPool(category), state.last[category]);
  if (!draw.result) return;
  const angle = stopAngle(draw.index, draw.segments.length);
  frame = {category, segments: draw.segments, angle:0, result:draw.result.id};
  spinning = frame;
  const task = spinning;
  render({refocus:'#spin'});
  const canvas = document.querySelector('#wheel');
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 2350;
  if (canvas?.animate && duration) {
    const animation = canvas.animate([{transform:'rotate(0deg)'}, {transform:'rotate(' + angle + 'deg)'}], {duration, easing:'cubic-bezier(.16,.65,.13,1)', fill:'forwards'});
    try { await animation.finished; } catch { /* The route may have changed. */ }
  }
  if (spinning !== task) return;
  spinning = null;
  const accepted = wheelPool(category).some(item => item.id === draw.result.id);
  const reveal = accepted && frame === task;
  if (accepted) {
    record(state, draw.result);
    persist();
  }
  if (frame === task) frame.angle = angle;
  if (current.page === 'roulette' || current.page === 'tea') {
    const focused = document.activeElement;
    const refocus = focused?.id ? '#' + CSS.escape(focused.id) : undefined;
    render({refocus});
    if (reveal && !dialog.open) {
      detail(draw.result, document.querySelector('#spin'), true);
      celebrate(dialog);
    }
  }
}

function generate(targets) {
  const pools = targets.map(category => {
    const preferred = eligible(category, state);
    const minimum = category === 'Milk Tea' ? 1 : 2;
    const desired = category === 'Milk Tea' ? 1 : 3;
    const pool = preferred.length >= desired ? preferred : eligible(category, {...state, preferences:[]});
    return {category, pool, minimum};
  });
  const short = pools.find(({pool, minimum}) => pool.length < minimum);
  if (short) {
    dialog.querySelector('#plan-feedback').textContent = copy('Too few eligible options for ', '符合条件的选项不足：') + t(short.category);
    return false;
  }
  state.plan = {};
  for (const {category, pool} of pools) {
    const picks = shuffle(pool).slice(0, category === 'Milk Tea' ? 1 : 3);
    state.plan[category] = picks.map(item => item.id);
    for (const item of picks) record(state, item);
  }
  persist();
  return true;
}

function showDialog(html, trigger) {
  if (!dialog.open) dialogTrigger = trigger;
  dialog.innerHTML = html;
  localize(dialog, language);
  enhanceSelects(dialog);
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
  const identity = item.brand ? brandName(item.brand) + ' · ' + t(item.productCategory) : t(cuisineOf(item));
  showDialog('<div class="dialog-head"><div><p class="eyebrow">' + t('Your pick') +
    '</p><h2 id="detail-title">' + escape(itemName(item)) + '</h2><p class="muted">' + escape(withRegion(identity, item)) +
    '</p></div>' +
    '<button class="icon-button" data-action="close" aria-label="Close details">×</button></div>' +
    '<div class="dialog-actions">' + button(copy('Add to menu','加入菜单'), 'add-menu', item.id, true) +
    button(state.favorites.includes(item.id) ? 'Remove Favorite' : 'Save Favorite', 'favorite', item.id) + '</div>', trigger);
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
  if (action === 'language') {
    if (spinning) return;
    control.dataset.animated = '';
    language = language === 'en' ? 'zh' : 'en';
    try { storage?.setItem('what-to-eat:language', language); } catch {}
    render();
    languageAnimation?.cancel();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      languageAnimation = main.animate([{opacity: .35}, {opacity: 1}], interfaceMotion());
    }
    return;
  }
  if (action === 'spin') { void spin(value); return; }
  if (action === 'account-section') { accountSection = value; rerenderAction(control); return; }
  if (action === 'clear-menu' || action === 'clear-category' || action === 'remove-menu') {
    if (action === 'clear-menu') state.plan = {};
    else if (action === 'clear-category') delete state.plan[value];
    else removeFromMenu(value, [control.dataset.meal]);
    persist();
    render({refocus:'.plan-add'});
    return;
  }
  if (action === 'add-menu') {
    const item = catalog[current.category]?.find(candidate => candidate.id === value);
    if (!item) return;
    state.plan[item.category] = [...new Set([...plannedIds(item.category), item.id])];
    persist();
    const message = copy('You can see this dish in Daily Meal Plan.', '您可以在一日菜单中看到此菜品。');
    if (dialog.open) dialog.close();
    notify(message);
    return;
  }
  if (action === 'credits') {
    showDialog('<div class="dialog-head"><h2 id="detail-title">Credits</h2><button class="icon-button" data-action="close" aria-label="Close details">×</button></div>' +
      '<div class="dialog-body credits-body"><h3>Creators</h3><ul><li>' + copy('Xingyi Huang (Silas)','黄兴翊') +
      '</li><li>Codex</li></ul><h3>Contributors</h3><ul><li>' + copy('Nike Chen','陈妮可') + '</li><li>' + copy('Yulin Gu','古钰琳') + '</li></ul></div>', control);
    return;
  }
  if (action === 'project-info') {
    const chinese = language === 'zh';
    const title = projectInfo.textContent;
    const description = chinese
      ? '本项目是温州肯恩大学 ESL 0303 W43 课程作业《Infomercial Group Invention》的一部分。'
      : 'This project is part of the “Infomercial Group Invention” assignment for ESL 0303 W43 at Wenzhou-Kean University.';
    showDialog(
      '<div class="dialog-head"><h2 id="detail-title">' + title + '</h2>' +
      '<button class="icon-button" type="button" data-action="close" aria-label="Close details">×</button></div>' +
      '<div class="dialog-body credits-body"><p>' + description + '</p>' +
      '<p><strong>' + (chinese ? '指导老师' : 'Instructor') + '</strong> · Benjamin Dudley</p>' +
      '<h3>' + (chinese ? '联系 Xingyi Huang' : 'Contact Xingyi Huang') + '</h3>' +
      '<ul><li>' + (chinese ? '个人邮箱' : 'Personal email') +
      ' · <a href="mailto:Philosel@outlook.com">Philosel@outlook.com</a></li>' +
      '<li>' + (chinese ? '学校邮箱' : 'University email') +
      ' · <a href="mailto:huangxi@kean.edu">huangxi@kean.edu</a></li></ul></div>', control);
    return;
  }
  if (action === 'support') {
    showDialog('<div class="dialog-head"><h2 id="detail-title">Support the project</h2><button class="icon-button" type="button" data-action="close" aria-label="Close details">×</button></div>' +
      '<div class="dialog-body support-body"><p>If this site helped you decide what to eat, you can leave an optional tip through WeChat.</p>' +
      '<img class="support-qr" src="' + supportCode + '" alt="WeChat tipping QR code"><p>Scan with WeChat. On the same phone, save the image and open it from WeChat Scan.</p>' +
      '<a class="button secondary" href="' + supportCode + '" download="what-to-eat-wechat.jpg">Save QR code</a></div>', control);
    return;
  }
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
    const nextItem = document.querySelectorAll('#tea-items .item-title')[index];
    if (nextItem) { nextItem.closest('details').open = true; nextItem.focus(); }
    return;
  }
  if (action === 'random-all') {
    showDialog('<div class="dialog-head"><h2 id="detail-title">' + copy('Plan My Day','一键安排今天') +
      '</h2><button class="icon-button" data-action="close" aria-label="Close details">×</button></div>' +
      '<form class="dialog-body" id="plan-form"><label class="check"><input type="checkbox" name="snack">' +
      copy('Include late-night snack','安排夜宵') + '</label><label class="check"><input type="checkbox" name="tea">' +
      copy('Include milk tea','安排奶茶') + '</label><div id="plan-brand-field" hidden><label>' + copy('Tea brand','茶饮品牌') +
      '<select name="brand">' + option('',copy('All brands','全部品牌'),true) +
      brands.map(brand => option(brand.name,brandName(brand.name),false)).join('') +
      '</select></label></div><p role="status" id="plan-feedback"></p><div class="actions"><button class="button primary" type="submit">' +
      copy('Confirm','确定') + '</button></div></form>', control);
    return;
  }
  if (action === 'custom') {
    showDialog('<div class="dialog-head"><h2 id="detail-title">Custom restrictions</h2>' +
      '<button class="icon-button" data-action="close" aria-label="Close details">×</button></div>' +
      '<form class="dialog-body" id="custom-form"><label for="custom">Foods or ingredients to avoid</label>' +
      '<textarea id="custom" rows="3" maxlength="1000">' + escape(state.custom) + '</textarea>' +
      '<div class="actions"><button class="button primary" type="submit">Save restrictions</button></div></form>', control);
    return;
  }
  if (action === 'clear-history') { dialog.close(); state.history = []; persist('History cleared.'); }
  if (action === 'random-brand') {
    const available = [...new Set(eligible('Milk Tea', state, '').filter(menuEligible).map(item => item.brand))];
    const other = available.filter(brand => brand !== state.brand);
    if (!available.length) { notify('No brands match your restrictions.'); return; }
    subgroup = '';
    state.brand = shuffle(other.length ? other : available)[0];
    frame = null; teaLimit = 24;
    persist(brandName(state.brand) + (language === 'zh' ? ' 已选中。' : ' selected.'));
  }
  if (action === 'favorite') {
    state.favorites = toggle(state.favorites, value);
    persist(state.favorites.includes(value) ? 'Saved to favorites.' : 'Removed from favorites.');
  }
  if (action === 'exclude' || action === 'restore') {
    state.excluded = action === 'exclude' ? [...new Set([...state.excluded, value])] : state.excluded.filter(id => id !== value);
    if (action === 'exclude') {
      removeFromMenu(value);
      for (const category of categories) {
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
  if (input.id === 'wheel-group') { subgroup = input.value; frame = null; render({refocus:'#wheel-group'}); return; }
  if (input.id === 'tea-type') { teaType = input.value; teaLimit = 24; renderTeaItems(); return; }
  if (input.id === 'brand') { subgroup = ''; state.brand = input.value; frame = null; teaLimit = 24; }
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
dialog.addEventListener('change', event => {
  if (event.target.name === 'tea') dialog.querySelector('#plan-brand-field').hidden = !event.target.checked;
});
dialog.addEventListener('submit', event => {
  event.preventDefault();
  if (event.target.id === 'custom-form') {
    state.custom = dialog.querySelector('#custom').value.trim();
    persist('Custom restrictions saved.');
    dialog.close();
    return;
  }
  if (event.target.id !== 'plan-form') return;
  const form = new FormData(event.target);
  const previous = {includeSnack:state.includeSnack, includeTea:state.includeTea, brand:state.brand};
  state.includeSnack = form.has('snack');
  state.includeTea = form.has('tea');
  if (state.includeTea) state.brand = form.get('brand');
  if (!generate(activePlanCategories())) { Object.assign(state, previous); return; }
  dialog.close();
  location.hash = 'plan';
});
syncRoute();



