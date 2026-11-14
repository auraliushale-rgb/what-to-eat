import { test } from 'node:test';
import assert from 'node:assert/strict';
import { brands, byId, catalog, categories, eligible, items, menuEligible, normalize, pointerIndex, restrictions, stopAngle, wheelDraw } from '../src/catalog.js';
import { loadState, record, saveState } from '../src/state.js';

const clean = () => loadState({getItem: () => null});
const normalizeTitle = name => normalize(name).replace(/[\s\p{Punctuation}]+/gu, '');
const noPlaceholders = /^(chinese food|noodles|rice|western food|dessert|milk tea|fruit tea|brown sugar tea|food\s*\d+|dish\s*\d+|placeholder|sample)$/i;

test('catalog meets meal minimums and each named record is unique', () => {
  const sizes = [70,90,90,50];
  assert.equal(items.length, byId.size);
  assert.equal(brands.length, 12);
  const names = new Set();
  const originalNames = new Set();
  const auditedIds = new Set();
  for (const [i, category] of categories.entries()) {
    assert.ok(catalog[category].length >= (sizes[i] ?? 1));
    for (const item of catalog[category]) {
      assert.ok(byId.has(item.id));
      assert.equal(item.category, category);
      if (auditedIds.has(item.id)) continue;
      auditedIds.add(item.id);
      assert.equal(item.category, category);
      assert.match(item.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.ok(item.name && (item.brand || !noPlaceholders.test(item.name)), item.name);
      assert.ok(item.cuisine && Array.isArray(item.ingredients));
      assert.ok(Array.isArray(item.dietaryTags) && Array.isArray(item.allergens));
      const prefix = item.brand ?? 'food';
      const key = prefix + '/' + normalizeTitle(item.name);
      assert.ok(!names.has(key), key);
      names.add(key);
      if (item.nameChinese) {
        const original = prefix + '/' + normalizeTitle(item.nameChinese);
        assert.ok(!originalNames.has(original), original);
        originalNames.add(original);
      }
      if (item.brand) {
        assert.ok(brands.some(brand => brand.name === item.brand));
        assert.match(item.nameChinese, /[\p{Script=Han}]/u);
        if (item.source === "User-provided menu document") {
          assert.equal(item.ingredientEvidence, "unknown");
          assert.ok(item.productCategory && item.availability);
          continue;
        }
        assert.match(item.source, /^https:\/\/[^ ]+$/);
        assert.match(item.lastVerified, /^\d{4}-\d{2}-\d{2}$/);
        assert.ok(item.market && item.productCategory && item.availability);
        if (item.price) assert.ok(item.price.amount > 0 && /^[A-Z]{3}$/.test(item.price.currency));
      } else assert.ok(item.ingredientEvidence === "unknown" || item.ingredients.length > 0);
    }
  }
  for (const brand of brands) assert.ok(catalog['Milk Tea'].filter(item => item.brand === brand.name).length >= 15, brand.name);
});

test('every category draws from its catalog and points exactly to the winner', () => {
  for (const category of categories) {
    const pool = eligible(category, clean());
    const seen = new Set();
    let previous;
    for (let iteration = 0; iteration < 150; iteration += 1) {
      const draw = wheelDraw(pool, previous);
      assert.ok(draw.segments.every(item => catalog[category].includes(item)));
      assert.equal(draw.segments[pointerIndex(stopAngle(draw.index, draw.segments.length), draw.segments.length)], draw.result);
      assert.notEqual(draw.result.id, previous);
      seen.add(draw.result.id);
      previous = draw.result.id;
    }
    assert.ok(seen.size > 30);
  }
  for (let n = 1; n <= 8; n += 1) {
    for (let i = 0; i < n; i += 1) {
      for (const value of [0, 0.5, 0.99999]) assert.equal(pointerIndex(stopAngle(i,n,()=>value), n), i);
    }
  }
  assert.equal(wheelDraw([], '').result, null);
  const only = catalog.Lunch.slice(0,1);
  assert.equal(wheelDraw(only, only[0].id).result, only[0]);
});

test('preferences prioritize matches after restrictions and exclusions', () => {
  const state = clean();
  const cases = {
    'No Beef':['beef-chow-fun','american-cheeseburger'],
    'No Pork':['char-siu-rice','mapo-tofu'],
    'No Chicken':['kung-pao-chicken','mouthwatering-chicken'],
    'No Mushrooms':['steamed-chicken-with-shiitake','shandong-braised-chicken-and-rice'],
    'No Spicy Food':['dan-dan-noodles','chongqing-spicy-noodles'],
  };
  for (const rule of restrictions) {
    const pool = eligible('Lunch',{...state,restrictions:[rule]});
    if (!cases[rule]) assert.equal(pool.length,0,rule);
    else {
      assert.ok(pool.length);
      for (const id of cases[rule].filter(id => id !== 'mapo-tofu')) assert.ok(!pool.some(item => item.id === id), id);
    }
  }
  state.preferences = ['Japanese Food'];
  state.restrictions = ['No Pork'];
  state.excluded = ['gyudon'];
  state.custom = 'chicken, tuna';
  const pool = eligible('Lunch',state);
  assert.ok(pool.length > 0);
  assert.ok(pool.every(item => item.cuisine === 'Japanese'));
  assert.ok(!pool.some(item => ['gyudon','tonkotsu-ramen','chicken-katsu-curry','tekka-don'].includes(item.id)));
});

test('every brand is selectable, while unknown ingredients fail allergy filters', () => {
  const state = clean();
  for (const {name} of brands) {
    const pool = eligible('Milk Tea', state, name);
    assert.ok(pool.length && pool.every(item => item.brand === name && menuEligible(item)));
    assert.equal(eligible('Milk Tea', {...state,restrictions:['No Dairy']}, name).length,0);
  }
  assert.equal(new Set(eligible('Milk Tea', state).map(item => item.brand)).size,12);
  const filtered = eligible('Milk Tea', {...state,custom:'mango'});
  assert.ok(filtered.length > 0 && filtered.length < catalog['Milk Tea'].length);
  assert.ok(filtered.every(item => !normalize(item.name).includes('mango')));
});

test('history, favorites, independent category picks and settings survive a reload', () => {
  const values = new Map();
  const storage = {getItem: key => values.get(key), setItem: (key,value) => values.set(key,value)};
  const state = loadState(storage);
  const breakfast = catalog.Breakfast[0];
  const dinner = catalog.Dinner[0];
  record(state, breakfast, 100);
  record(state, dinner, 200);
  state.plan.Dinner = [dinner.id];
  state.favorites.push(dinner.id);
  state.excluded.push(breakfast.id);
  state.preferences = ['Western Food'];
  state.restrictions = ['No Beef'];
  state.custom = 'mushroom';
  state.brand = 'CoCo';
  assert.ok(saveState(storage,state));
  assert.deepEqual(loadState(storage),state);
  assert.equal(state.last.Breakfast,breakfast.id);
  assert.equal(state.history[0].id,dinner.id);
  assert.deepEqual(loadState({getItem: () => '{bad json'}),clean());
});
