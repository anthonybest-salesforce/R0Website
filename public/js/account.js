/**
 * Gray Rock - Account page: load user and orders from API
 */
(function() {
  async function init() {
    var emailEl = document.querySelector('.account-email');
    var orderListEl = document.querySelector('.order-list');

    try {
      var meRes = await fetch('/api/me', { credentials: 'include' });
      if (!meRes.ok) {
        localStorage.removeItem('loggedIn');
        window.location.href = 'signin.html?redirect=' + encodeURIComponent('account.html');
        return;
      }
      var me = await meRes.json();
      localStorage.setItem('loggedIn', 'true');
      if (emailEl) emailEl.textContent = me.email || '';

      if (me.email) {
        document.dispatchEvent(new CustomEvent('orgGrayRockSalesforceEvent', {
          detail: { type: 'identity', detail: { email: me.email } }
        }));
        if (window.orgGrayRockSalesforce && typeof window.orgGrayRockSalesforce.sendAccountView === 'function') {
          window.orgGrayRockSalesforce.sendAccountView(me);
        }
      }

      var authBtn = document.getElementById('authBtn');
      if (authBtn) {
        authBtn.textContent = 'Log Out';
        authBtn.href = '#';
        authBtn.onclick = function(e) {
          e.preventDefault();
          fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(function() {});
          localStorage.removeItem('loggedIn');
          window.location.href = 'index.html';
        };
      }

      var ordersRes = await fetch('/api/orders', { credentials: 'include' });
      if (ordersRes.ok) {
        var data = await ordersRes.json();
        if (orderListEl) {
          if (!data.orders || data.orders.length === 0) {
            orderListEl.innerHTML = '<p class="order-empty">No orders yet. <a href="shop.html">Start shopping</a></p>';
          } else {
            orderListEl.innerHTML = data.orders.map(function(o) {
            var items = o.items || [];
            var first = items[0];
            var productId = first ? first.product_id : 'river-pebbles';
            var safeId = productId || 'river-pebbles';
            var date = o.created_at ? new Date(o.created_at).toLocaleDateString('en-US') : '';
            var total = parseFloat(o.total) || 0;
            var itemsHtml = items.map(function(i) {
              var qty = i.qty || 1;
              var price = parseFloat(i.price || 0);
              var lineTotal = price * qty;
              return '<div class="order-item-line">' + (i.product_name || 'Item') + ' × ' + qty + ' — $' + lineTotal.toFixed(2) + '</div>';
            }).join('');
            return '<div class="order-card">' +
              '<div class="order-image product-image product-image-' + safeId + '"></div>' +
              '<div class="order-details">' +
                '<span class="order-number">Order #RZ-' + o.id + '</span>' +
                '<span class="order-date">' + date + '</span>' +
                '<div class="order-items-list">' + itemsHtml + '</div>' +
                '<span class="order-total">Total: $' + total.toFixed(2) + '</span>' +
                '<span class="order-status">Delivered</span>' +
              '</div>' +
            '</div>';
          }).join('');
          }
        }
      }
    } catch (e) {
      window.location.href = 'signin.html?redirect=' + encodeURIComponent('account.html');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
