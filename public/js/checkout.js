/**
 * Gray Rock - Checkout page
 * Collects payment info with masked display (#). No authorization.
 */
(function() {
  function formatPrice(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function initMaskedInputs() {
    document.querySelectorAll('.masked-input[data-mask]').forEach(function(input) {
      input.setAttribute('data-real-value', '');
      var isUpdating = false;
      input.addEventListener('input', function() {
        if (isUpdating) return;
        var val = input.value;
        input.setAttribute('data-real-value', val);
        isUpdating = true;
        input.value = val.replace(/./g, '#');
        input.setSelectionRange(val.length, val.length);
        isUpdating = false;
      });
      input.addEventListener('focus', function() {
        var real = input.getAttribute('data-real-value') || '';
        input.value = real.replace(/./g, '#');
        if (real.length) input.setSelectionRange(real.length, real.length);
      });
      input.addEventListener('blur', function() {
        var real = input.getAttribute('data-real-value') || '';
        input.value = real.replace(/./g, '#');
      });
    });
  }

  function getRealValue(input) {
    if (!input) return '';
    if (input.hasAttribute('data-mask')) {
      return input.getAttribute('data-real-value') || '';
    }
    return input.value || '';
  }

  function renderOrderSummary() {
    var cart = window.orgGrayRockCart ? window.orgGrayRockCart.getCart() : [];
    var itemsEl = document.getElementById('checkoutItems');
    var totalEl = document.getElementById('checkoutTotal');
    if (!itemsEl || !totalEl) return;

    if (cart.length === 0) return;

    var total = 0;
    itemsEl.innerHTML = cart.map(function(item) {
      var lineTotal = item.price * (item.qty || 1);
      total += lineTotal;
      return '<div class="checkout-item">' +
        '<span class="checkout-item-name">' + escapeHtml(item.name) + ' × ' + item.qty + '</span>' +
        '<span class="checkout-item-price">' + formatPrice(lineTotal) + '</span>' +
      '</div>';
    }).join('');
    totalEl.textContent = formatPrice(total);
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function switchPaymentMethod(method) {
    var creditForm = document.getElementById('creditCardForm');
    var walletForm = document.getElementById('walletForm');
    var walletTitle = document.getElementById('walletFormTitle');
    if (!creditForm || !walletForm) return;

    if (method === 'credit') {
      creditForm.style.display = 'block';
      walletForm.style.display = 'none';
    } else {
      creditForm.style.display = 'none';
      walletForm.style.display = 'block';
      var titles = { applepay: 'Apple Pay', googlepay: 'Google Pay', amazonpay: 'Amazon Pay' };
      if (walletTitle) walletTitle.textContent = titles[method] || 'Wallet Payment';
    }
  }

  function collectPaymentData() {
    var method = (document.querySelector('input[name="paymentMethod"]:checked') || {}).value || 'credit';
    var data = { method: method };

    if (method === 'credit') {
      data.cardNumber = getRealValue(document.getElementById('cardNumber'));
      data.cardExpiry = getRealValue(document.getElementById('cardExpiry'));
      data.cardCvv = getRealValue(document.getElementById('cardCvv'));
      data.cardName = getRealValue(document.getElementById('cardName'));
    } else {
      data.email = getRealValue(document.getElementById('walletEmail'));
      data.password = getRealValue(document.getElementById('walletPassword'));
    }
    return data;
  }

  async function placeOrder() {
    var cart = window.orgGrayRockCart ? window.orgGrayRockCart.getCart() : [];
    if (cart.length === 0) return;

    var total = window.orgGrayRockCart ? window.orgGrayRockCart.getTotal() : 0;
    var paymentData = collectPaymentData();
    console.log('[Gray Rock] Checkout (demo, no auth):', {
      items: cart,
      total: total,
      paymentMethod: paymentData.method,
      paymentDataCollected: true
    });

    try {
      sessionStorage.setItem('orgGrayRockLastOrder', JSON.stringify({
        items: cart,
        total: total,
        paymentMethod: paymentData.method
      }));
    } catch (e) {}

    var orderId = null;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: cart, total })
      });
      if (res.ok) {
        var d = await res.json();
        if (d.orderId) {
          orderId = String(d.orderId);
          sessionStorage.setItem('orgGrayRockLastOrderId', orderId);
        }
      }
    } catch (e) {}

    if (window.orgGrayRockSalesforce && typeof window.orgGrayRockSalesforce.sendPurchase === 'function') {
      window.orgGrayRockSalesforce.sendPurchase(orderId, total, cart);
    }

    if (window.orgGrayRockCart) {
      try {
        localStorage.setItem('orgGrayRockCart', '[]');
        document.dispatchEvent(new CustomEvent('orgGrayRockCartUpdated', { detail: { items: [] } }));
      } catch (e) {}
    }

    window.location.href = 'order-confirmation.html';
  }

  function init() {
    var cart = window.orgGrayRockCart ? window.orgGrayRockCart.getCart() : [];
    var emptyEl = document.getElementById('checkoutEmpty');
    var contentEl = document.getElementById('checkoutContent');

    if (cart.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (contentEl) contentEl.style.display = 'none';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    renderOrderSummary();
    initMaskedInputs();

    document.querySelectorAll('input[name="paymentMethod"]').forEach(function(radio) {
      radio.addEventListener('change', function() {
        switchPaymentMethod(radio.value);
      });
    });

    var placeBtn = document.getElementById('placeOrderBtn');
    if (placeBtn) {
      placeBtn.addEventListener('click', placeOrder);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
