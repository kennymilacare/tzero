/* ===========================================================
   products.js — catalog page: render, filter, sort, count
   =========================================================== */

import { products, brands } from './data.js?v=25';
import { productCardHTML } from './product-svg.js?v=8';
import { t, initI18n } from './i18n.js?v=7';

/* ---------- State ---------- */

const state = {
  brands: new Set(),      // brand ids selected
  types: new Set(),       // product types selected
  sort: 'popular',        // popular | newest | priceAsc | priceDesc
};

/* ---------- Helpers ---------- */

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    brand: params.get('brand'),
    type: params.get('type'),
  };
}

function applyUrlFilters() {
  const { brand, type } = readUrlParams();
  if (brand) {
    document.querySelectorAll('input[name="brand"]').forEach((i) => {
      i.checked = i.value === brand;
    });
  }
  if (type) {
    document.querySelectorAll('input[name="type"]').forEach((i) => {
      i.checked = i.value === type;
    });
  }
}

function readFilters() {
  state.brands = new Set(
    [...document.querySelectorAll('input[name="brand"]:checked')].map((i) => i.value)
  );
  state.types = new Set(
    [...document.querySelectorAll('input[name="type"]:checked')].map((i) => i.value)
  );
  state.sort = document.querySelector('[data-sort]')?.value || 'popular';
}

function applyFilters(list) {
  return list.filter((p) => {
    if (state.brands.size && !state.brands.has(p.brand)) return false;
    if (state.types.size && !state.types.has(p.type)) return false;
    return true;
  });
}

function applySort(list) {
  const copy = [...list];
  switch (state.sort) {
    case 'priceAsc':  return copy.sort((a, b) => a.price_hkd - b.price_hkd);
    case 'priceDesc': return copy.sort((a, b) => b.price_hkd - a.price_hkd);
    case 'newest':    return copy.reverse();
    case 'popular':
    default:
      return copy.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
  }
}

/* ---------- Render ---------- */

function renderFilters() {
  const brandBox = document.querySelector('[data-filter-brand]');
  const typeBox  = document.querySelector('[data-filter-type]');

  if (brandBox) {
    brandBox.innerHTML = brands.map((b) => `
      <label class="filter-option">
        <input type="checkbox" name="brand" value="${b.id}">
        <span>${b.name}</span>
      </label>
    `).join('');
  }

  if (typeBox) {
    const types = [
      { id: 'ultra-thin', key: 'products.type.ultra-thin' },
      { id: 'textured',   key: 'products.type.textured' },
      { id: 'functional', key: 'products.type.functional' },
    ];
    typeBox.innerHTML = types.map((t0) => `
      <label class="filter-option">
        <input type="checkbox" name="type" value="${t0.id}">
        <span data-i18n="${t0.key}">${t(t0.key)}</span>
      </label>
    `).join('');
  }
}

function render() {
  readFilters();
  const filtered = applySort(applyFilters(products));
  const grid = document.querySelector('[data-grid]');
  const count = document.querySelector('[data-count]');
  const empty = document.querySelector('[data-empty]');

  if (grid) {
    if (!filtered.length) {
      grid.innerHTML = '';
    } else {
      grid.innerHTML = filtered.map(productCardHTML).join('');
    }
  }

  if (count) {
    count.innerHTML = `
      <span data-i18n="products.count">顯示</span>
      <strong>${filtered.length}</strong>
      <span>/</span>
      <strong>${products.length}</strong>
    `;
  }

  if (empty) {
    empty.style.display = filtered.length ? 'none' : 'block';
  }
}

/* ---------- Init ---------- */

function init() {
  initI18n();
  renderFilters();
  applyUrlFilters();

  document.querySelectorAll('input[name="brand"], input[name="type"]').forEach((el) => {
    el.addEventListener('change', render);
  });
  document.querySelector('[data-sort]')?.addEventListener('change', render);

  render();

  // Re-translate filter labels when language changes
  document.addEventListener('lang:change', () => {
    renderFilters();
    render();
  });
}

document.addEventListener('DOMContentLoaded', init);