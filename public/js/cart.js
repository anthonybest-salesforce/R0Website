/**
 * Gray Rock - Site-wide shopping cart
 * Uses localStorage; cart persists across pages.
 */
(function() {
  var CART_KEY = 'orgGrayRockCart';

  function getCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      document.dispatchEvent(new CustomEvent('orgGrayRockCartUpdated', { detail: { items: items } }));
    } catch (e) {
      console.warn('[Gray Rock] Could not save cart:', e);
    }
  }

  function addToCart(productId, productName, price, qty) {
    qty = Math.max(1, parseInt(qty, 10) || 1);
    var cart = getCart();
    var existing = cart.find(function(i) { return i.id === productId; });
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ id: productId, name: productName, price: price, qty: qty });
    }
    saveCart(cart);
    if (window.orgGrayRockSalesforce && typeof window.orgGrayRockSalesforce.sendAddToCart === 'function') {
      window.orgGrayRockSalesforce.sendAddToCart(productId, productName, price, qty);
    }
  }

  function removeFromCart(productId) {
    var cart = getCart().filter(function(i) { return i.id !== productId; });
    saveCart(cart);
  }

  function updateQty(productId, qty) {
    if (qty < 1) {
      removeFromCart(productId);
      return;
    }
    var cart = getCart();
    var item = cart.find(function(i) { return i.id === productId; });
    if (item) {
      item.qty = qty;
      saveCart(cart);
    }
  }

  function getCount() {
    return getCart().reduce(function(sum, i) { return sum + (i.qty || 1); }, 0);
  }

  function getTotal() {
    return getCart().reduce(function(sum, i) {
      return sum + (i.price * (i.qty || 1));
    }, 0);
  }

  window.orgGrayRockCart = {
    getCart: getCart,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    updateQty: updateQty,
    getCount: getCount,
    getTotal: getTotal
  };

  function formatPrice(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderCartPanel() {
    var cart = getCart();
    var panel = document.getElementById('cartPanel');
    if (!panel) return;

    var list = panel.querySelector('.cart-items');
    var empty = panel.querySelector('.cart-empty');
    var totalEl = panel.querySelector('.cart-total');
    var listWrap = panel.querySelector('.cart-items-wrap');

    if (cart.length === 0) {
      if (empty) empty.style.display = 'block';
      if (listWrap) listWrap.style.display = 'none';
      if (totalEl) totalEl.textContent = formatPrice(0);
      return;
    }

    if (empty) empty.style.display = 'none';
    if (listWrap) listWrap.style.display = 'block';
    if (totalEl) totalEl.textContent = formatPrice(getTotal());

    if (list) {
      list.innerHTML = cart.map(function(item) {
        var lineTotal = item.price * (item.qty || 1);
        return '<div class="cart-item" data-id="' + item.id + '">' +
          '<div class="cart-item-info">' +
            '<span class="cart-item-name">' + escapeHtml(item.name) + '</span>' +
            '<span class="cart-item-price">' + formatPrice(item.price) + ' × ' + item.qty + ' = ' + formatPrice(lineTotal) + '</span>' +
          '</div>' +
          '<div class="cart-item-actions">' +
            '<button type="button" class="cart-qty-btn" data-action="minus" aria-label="Decrease">−</button>' +
            '<span class="cart-qty">' + item.qty + '</span>' +
            '<button type="button" class="cart-qty-btn" data-action="plus" aria-label="Increase">+</button>' +
            '<button type="button" class="cart-remove" data-id="' + item.id + '" aria-label="Remove">×</button>' +
          '</div>' +
        '</div>';
      }).join('');

      list.querySelectorAll('.cart-qty-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var itemEl = btn.closest('.cart-item');
          var id = itemEl && itemEl.dataset.id;
          if (!id) return;
          var item = cart.find(function(i) { return i.id === id; });
          if (!item) return;
          var qty = item.qty;
          if (btn.dataset.action === 'plus') updateQty(id, qty + 1);
          else updateQty(id, qty - 1);
        });
      });

      list.querySelectorAll('.cart-remove').forEach(function(btn) {
        btn.addEventListener('click', function() {
          removeFromCart(btn.dataset.id);
        });
      });
    }
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function updateCartBadge() {
    var badge = document.getElementById('cartCount');
    if (badge) {
      var n = getCount();
      badge.textContent = n;
      badge.style.display = n > 0 ? 'flex' : 'none';
    }
  }

  function initCartUI() {
    var btn = document.getElementById('cartBtn');
    var panel = document.getElementById('cartPanel');
    var overlay = document.getElementById('cartOverlay');
    var closeBtn = document.getElementById('cartClose');

    if (btn && panel) {
      btn.addEventListener('click', function() {
        panel.classList.add('cart-panel-open');
        if (overlay) overlay.classList.add('cart-overlay-visible');
        renderCartPanel();
        var cart = getCart();
        if (cart.length > 0 && window.orgGrayRockSalesforce && typeof window.orgGrayRockSalesforce.sendReplaceCart === 'function') {
          window.orgGrayRockSalesforce.sendReplaceCart(cart);
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        panel.classList.remove('cart-panel-open');
        if (overlay) overlay.classList.remove('cart-overlay-visible');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', function() {
        panel.classList.remove('cart-panel-open');
        overlay.classList.remove('cart-overlay-visible');
      });
    }

    document.addEventListener('orgGrayRockCartUpdated', function() {
      updateCartBadge();
      if (panel && panel.classList.contains('cart-panel-open')) {
        renderCartPanel();
      }
    });

    updateCartBadge();
  }

  function injectCartHTML() {
    if (document.getElementById('cartPanel')) return;

    var overlay = document.createElement('div');
    overlay.id = 'cartOverlay';
    overlay.className = 'cart-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    var panel = document.createElement('div');
    panel.id = 'cartPanel';
    panel.className = 'cart-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Shopping cart');
    panel.innerHTML =
      '<div class="cart-panel-header">' +
        '<h3>Shopping Cart</h3>' +
        '<button type="button" id="cartClose" class="cart-close" aria-label="Close cart">&times;</button>' +
      '</div>' +
      '<div class="cart-panel-body">' +
        '<p class="cart-empty" style="display:none">Your cart is empty.</p>' +
        '<div class="cart-items-wrap">' +
          '<div class="cart-items"></div>' +
          '<div class="cart-total-row">Total: <strong class="cart-total">$0.00</strong></div>' +
          '<a href="checkout.html" class="btn btn-primary btn-block cart-checkout-btn">Checkout</a>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(panel);
  }

  function ensureCartButton() {
    var ctas = document.querySelector('.header-ctas');
    if (!ctas || document.getElementById('cartBtn')) return;

    var cartBtn = document.createElement('button');
    cartBtn.type = 'button';
    cartBtn.className = 'btn btn-cart';
    cartBtn.id = 'cartBtn';
    cartBtn.setAttribute('aria-label', 'Open shopping cart');
    cartBtn.innerHTML = '🛒 <span id="cartCount" class="cart-badge" style="display:none">0</span>';
    ctas.insertBefore(cartBtn, ctas.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectCartHTML();
      ensureCartButton();
      initCartUI();
    });
  } else {
    injectCartHTML();
    ensureCartButton();
    initCartUI();
  }
})();
