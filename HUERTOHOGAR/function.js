// arreglar el toggle del perfil de usuario
// arreglar el toggle del perfil de usuario
function toggleProfile() {
    // Elimina <script> y ejecuta solo JS
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const btnProfile = document.getElementById('btn-profile');
    const perfilSection = document.getElementById('perfil-section');
    const btnLogout = document.getElementById('btn-logout');

    if (btnLogin) {
        btnLogin.onclick = function() {
            btnLogin.classList.add('d-none');
            btnRegister.classList.add('d-none');
            btnProfile.classList.remove('d-none');
            perfilSection.classList.remove('d-none');
        };
    }
    if (btnRegister) {
        btnRegister.onclick = function() {
            btnLogin.classList.add('d-none');
            btnRegister.classList.add('d-none');
            btnProfile.classList.remove('d-none');
            perfilSection.classList.remove('d-none');
        };
    }
    if (btnLogout) {
        btnLogout.onclick = function() {
            btnLogin.classList.remove('d-none');
            btnRegister.classList.remove('d-none');
            btnProfile.classList.add('d-none');
            perfilSection.classList.add('d-none');
        };
    }
}

/* HuertoHogar - Carrito simple con localStorage
   API global: window.HHCart
*/
(function(){
  const CART_KEY = 'hh_cart';

  const fmtCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
  function formatCLP(n){ try { return fmtCLP.format(n || 0); } catch { return `$${(n||0).toLocaleString('es-CL')} CLP`; } }

  function get(){
    try{
      const raw = localStorage.getItem(CART_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    }catch{ return []; }
  }
  function save(arr){
    localStorage.setItem(CART_KEY, JSON.stringify(arr));
    dispatch('change');
  }
  function dispatch(type){
    document.dispatchEvent(new CustomEvent(`hhcart:${type}`, { detail: { cart: get() }}));
  }
  function find(id){
    return get().find(x => x.id === id);
  }
  function count(){
    return get().reduce((a,b) => a + Number(b.quantity || 0), 0);
  }
  function total(){
    return get().reduce((a,b) => a + (Number(b.price||0) * Number(b.quantity||0)), 0);
  }
  function upsertItem(item, qty, opts = {}){
    const { clampToStock = false } = opts;
    const cart = get();
    const idx = cart.findIndex(x => x.id === item.id);
    const stock = Number(item.stock || 0);
    const q = Number(qty || 1);

    let newQty = q;
    if (clampToStock && stock > 0) {
      // Si ya existe, acumulamos y clamp
      const existing = idx >= 0 ? Number(cart[idx].quantity || 0) : 0;
      newQty = Math.min(stock, existing + q);
    } else if (idx >= 0) {
      newQty = Number(cart[idx].quantity || 0) + q;
    }

    if (stock > 0 && newQty > stock) return false; // no cabe

    const normalized = {
      id: String(item.id),
      name: String(item.name),
      price: Number(item.price || 0),
      unit: item.unit || 'u',
      stock: stock,
      image: item.image || '',
      quantity: Math.max(1, Number(idx >= 0 ? (clampToStock ? newQty : (cart[idx].quantity || 0) + q) : newQty))
    };

    if (normalized.quantity > stock && stock > 0) return false;

    if (idx >= 0) {
      cart[idx] = { ...cart[idx], ...normalized };
    } else {
      cart.push(normalized);
    }
    save(cart);
    return true;
  }
  function add(item, qty = 1, opts = {}){
    return upsertItem(item, qty, opts);
  }
  function setQty(id, qty, opts = {}){
    const { clampToStock = false } = opts;
    const cart = get();
    const idx = cart.findIndex(x => x.id === id);
    if (idx < 0) return false;

    const stock = Number(cart[idx].stock || 0);
    let n = Number(qty || 1);
    if (Number.isNaN(n) || n < 1) n = 1;
    if (clampToStock && stock > 0) n = Math.min(stock, n);
    if (n > stock && stock > 0) return false;

    cart[idx].quantity = n;
    save(cart);
    return true;
  }
  function remove(id){
    const cart = get().filter(x => x.id !== id);
    save(cart);
  }
  function clear(){
    save([]);
  }

  function updateCartCountBadges(){
    const n = count();
    const els = document.querySelectorAll('.js-cart-count');
    els.forEach(el => { el.textContent = String(n); });
  }

  // Exponer API global
  window.HHCart = {
    get, save, add, setQty, remove, clear, count, total, find,
    updateCartCountBadges,
    formatCLP,
  };

  // Mantener badges al cambiar carrito
  document.addEventListener('hhcart:change', updateCartCountBadges);
  // Refrescar a la carga inicial
  document.addEventListener('DOMContentLoaded', updateCartCountBadges);
})();


// ================================== DEJAR RESEÑA ==================================

(function () {
  const PREFIX = 'hh:resenas:';
  const key = (id) => PREFIX + String(id);

  function cargarResenas(productId) {
    try {
      const raw = localStorage.getItem(key(productId));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function guardarResenas(productId, resenas) {
    localStorage.setItem(key(productId), JSON.stringify(resenas));
  }

  function calcularPromedio(resenas) {
    if (!resenas.length) return 0;
    const sum = resenas.reduce((a, r) => a + (Number(r.rating) || 0), 0);
    return Math.round((sum / resenas.length) * 10) / 10;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Función "colocar reseña" (reutilizable en cualquier producto)
  function colocarResena(productId, data) {
    const nombre = (data?.nombre || '').trim();
    const comentario = (data?.comentario || '').trim();
    const rating = Number(data?.rating);

    if (!productId || !nombre || !comentario || !(rating >= 1 && rating <= 5)) {
      return { ok: false, error: 'Datos inválidos' };
    }

    const resenas = cargarResenas(productId);
    resenas.push({
      nombre,
      comentario,
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      fecha: new Date().toISOString(),
    });
    guardarResenas(productId, resenas);
    return { ok: true };
  }

  function renderResenas(productId, els) {
    const resenas = cargarResenas(productId);

    if (!resenas.length) {
      if (els.list) els.list.classList.add('d-none');
      if (els.emptyState) els.emptyState.classList.remove('d-none');
    } else {
      if (els.list) {
        els.list.classList.remove('d-none');
        els.list.innerHTML = '';
        const frag = document.createDocumentFragment();

        resenas.slice().reverse().forEach((r) => {
          const li = document.createElement('li');
          li.className = 'list-group-item';
          const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
          const d = new Date(r.fecha);
          const fechaStr = isNaN(d) ? '' : d.toLocaleDateString();

          li.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <strong>${escapeHtml(r.nombre)}</strong>
                <div class="text-warning small">${stars}</div>
                <p class="mb-1">${escapeHtml(r.comentario)}</p>
              </div>
              <small class="text-muted">${fechaStr}</small>
            </div>`;
          frag.appendChild(li);
        });

        els.list.appendChild(frag);
      }
      if (els.emptyState) els.emptyState.classList.add('d-none');
    }

    if (els.promedio) {
      const avg = calcularPromedio(resenas);
      els.promedio.textContent = `${avg.toFixed(1)} ★`;
    }
    if (els.conteo) {
      els.conteo.textContent = String(resenas.length);
    }
  }

  function inicializarResenas(productId, els) {
    renderResenas(productId, els);

    if (els.form) {
      els.form.addEventListener('submit', function (e) {
        e.preventDefault();
        const payload = {
          nombre: els.nameInput?.value || '',
          comentario: els.commentInput?.value || '',
          rating: Number(els.ratingInput?.value),
        };
        const res = colocarResena(productId, payload);
        if (res.ok) {
          if (els.commentInput) els.commentInput.value = '';
          if (els.ratingInput) els.ratingInput.value = '';
          renderResenas(productId, els);
        } else {
          alert('Por favor completa nombre, calificación y comentario.');
        }
      });
    }
  }

  // Exponer en window para uso global
  window.colocarResena = colocarResena;
  window.cargarResenas = cargarResenas;
  window.inicializarResenas = inicializarResenas;
})();

/* ================================== CARRITO ================================== */
/* Carrito: gestión con localStorage, botones globales y render en carrito.html */
(() => {
  const STORAGE_KEY = 'hh_cart';
  const fmt = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

  const Cart = {
    items: [],
    load() {
      try { this.items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
      catch { this.items = []; }
      return this.items;
    },
    save() {  
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      updateBadge();
    },
    add(item) {
      const found = this.items.find(i => i.id === item.id);
      if (found) {
        found.qty = Math.min(9999, found.qty + (item.qty || 1));
      } else {
        this.items.push({ ...item, qty: Math.max(1, item.qty || 1) });
      }
      this.save();
    },
    remove(id) {
      this.items = this.items.filter(i => i.id !== id);
      this.save();
    },
    setQty(id, qty) {
      const it = this.items.find(i => i.id === id);
      if (!it) return;
      it.qty = Math.max(1, Math.min(9999, Number(qty) || 1));
      this.save();
    },
    clear() {
      this.items = [];
      this.save();
    },
    subtotal() {
      return this.items.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 0), 0);
    },
    count() {
      return this.items.reduce((s, i) => s + (i.qty || 0), 0);
    }
  };

  function updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const c = Cart.count();
    if (c > 0) {
      badge.textContent = c;
      badge.classList.remove('d-none');
    } else {
      badge.classList.add('d-none');
    }
  }

  // Enlaza botones globales [data-add-to-cart]
  function wireGlobalAddButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add-to-cart]');
      if (!btn) return;
      e.preventDefault();

      const data = btn.dataset;
      // Se esperan estos data-atributos:
      // data-product-id, data-product-name, data-product-price, data-product-img, data-product-unit, data-product-qty
      const id = data.productId;
      const name = data.productName;
      const price = Number((data.productPrice || '0').toString().replace(/[^\d]/g, '')) || 0;
      const img = data.productImg || '';
      const unit = data.productUnit || '';
      const qty = Number(data.productQty || 1) || 1;

      if (!id || !name || !price) {
        console.warn('Faltan data-atributos para agregar al carrito.', { id, name, price });
        return;
      }

      Cart.add({ id, name, price, img, unit, qty });
      toast('Producto agregado al carrito.');
      renderIfCartPage();
    });
  }

  // Render en carrito.html
  function renderCart() {
    const root = document.getElementById('carritoVista');
    const empty = document.getElementById('carritoVacio');
    const itemsBox = document.getElementById('cartItems');
    const sumProductos = document.getElementById('sumProductos');
    const sumSubtotal = document.getElementById('sumSubtotal');
    const sumTotal = document.getElementById('sumTotal');
    const checkoutBtn = document.querySelector('[data-checkout]');
    const clearBtn = document.querySelector('[data-clear-cart]');

    if (!root || !itemsBox) return;

    const items = Cart.load();
    if (!items.length) {
      root.classList.add('d-none');
      empty?.classList.remove('d-none');
      updateBadge();
      return;
    }
    empty?.classList.add('d-none');
    root.classList.remove('d-none');

    itemsBox.innerHTML = items.map(item => {
      const line = (Number(item.price) || 0) * (item.qty || 0);
      return `
        <div class="cart-item" data-id="${item.id}">
          <img class="cart-item__img" src="${item.img || 'assets/picture/placeholder.jpg'}" alt="${item.name}">
          <div>
            <h3 class="cart-item__title h6">${item.name}</h3>
            <div class="cart-item__meta">
              <span>${fmt.format(item.price)}${item.unit ? ` / ${item.unit}` : ''}</span>
            </div>
            <div class="cart-item__qty mt-2">
              <button class="btn btn-sm btn-outline-secondary" data-qty-minus>-</button>
              <input class="form-control form-control-sm" data-qty-input type="number" min="1" max="9999" value="${item.qty}" style="width:80px;">
              <button class="btn btn-sm btn-outline-secondary" data-qty-plus>+</button>
              <button class="btn btn-link cart-item__remove ms-2 p-0" data-remove>Quitar</button>
            </div>
          </div>
          <div class="cart-item__aside">
            <div class="cart-item__price">${fmt.format(line)}</div>
          </div>
        </div>
      `;
    }).join('');

    sumProductos.textContent = String(Cart.count());
    sumSubtotal.textContent = fmt.format(Cart.subtotal());
    sumTotal.textContent = fmt.format(Cart.subtotal());

    checkoutBtn?.removeAttribute('disabled');

    // Eventos por item
    itemsBox.querySelectorAll('.cart-item').forEach(row => {
      const id = row.getAttribute('data-id');
      row.querySelector('[data-qty-plus]')?.addEventListener('click', () => {
        const it = Cart.items.find(i => i.id === id);
        Cart.setQty(id, (it?.qty || 1) + 1);
        renderCart();
      });
      row.querySelector('[data-qty-minus]')?.addEventListener('click', () => {
        const it = Cart.items.find(i => i.id === id);
        Cart.setQty(id, (it?.qty || 1) - 1);
        renderCart();
      });
      row.querySelector('[data-qty-input]')?.addEventListener('input', (ev) => {
        Cart.setQty(id, ev.target.value);
        renderCart();
      });
      row.querySelector('[data-remove]')?.addEventListener('click', () => {
        Cart.remove(id);
        renderCart();
      });
    });

    clearBtn?.addEventListener('click', () => {
      if (confirm('¿Vaciar el carrito?')) {
        Cart.clear();
        renderCart();
      }
    });

    checkoutBtn?.addEventListener('click', () => {
      alert('Flujo de pago no implementado. Continúa con tu integración de pago.');
    });

    updateBadge();
  }

  function renderIfCartPage() {
    if (document.getElementById('carritoVista')) renderCart();
  }

  function toast(msg) {
    if (!('bootstrap' in window)) { console.log(msg); return; }
    let el = document.getElementById('cartToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cartToast';
      el.className = 'toast align-items-center text-bg-success border-0 position-fixed bottom-0 end-0 m-3';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      el.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">${msg}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      `;
      document.body.appendChild(el);
    } else {
      el.querySelector('.toast-body').textContent = msg;
    }
    new bootstrap.Toast(el, { delay: 1500 }).show();
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    Cart.load();
    updateBadge();
    wireGlobalAddButtons();
    renderIfCartPage();
    // Expone para depuración
    window.HHCart = Cart;
  });
})();

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add-to-cart]');
  if (!btn) return;
  e.preventDefault();

  const data = btn.dataset;
  const id = data.productId;
  const name = data.productName;
  const price = Number((data.productPrice || '0').toString().replace(/[^\d]/g, '')) || 0;
  const img = data.productImg || '';
  const unit = data.productUnit || '';

  // Leer cantidad desde el DOM si no viene en data-attributes
  const qtyFromDom = btn.closest('form')?.querySelector('#qtyInput')?.value;
  const qty = Number(data.productQty || qtyFromDom || 1) || 1;

  if (!id || !name || !price) {
    console.warn('Faltan data-atributos para agregar al carrito.', { id, name, price });
    return;
  }

  Cart.add({ id, name, price, img, unit, qty });
  toast('Producto agregado al carrito.');
  renderIfCartPage();
});
// ...existing code...

// Opcional: stub simple para reseñas si no existe implementación aún
window.inicializarResenas = window.inicializarResenas || function(productId, els){
  els.form?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    els.emptyState?.classList.add('d-none');
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = `${els.nameInput.value} (${els.ratingInput.value}★): ${els.commentInput.value}`;
    els.list?.appendChild(li);
    els.list?.classList.remove('d-none');
    const count = Number(els.conteo?.textContent || '0') + 1;
    els.conteo.textContent = String(count);
    els.promedio.textContent = `${(Number(els.ratingInput.value)||5).toFixed(1)} ★`;
    els.form.reset();
  });
};










