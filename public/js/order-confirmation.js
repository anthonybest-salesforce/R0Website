/**
 * Gray Rock - Order confirmation page
 * Displays order details from sessionStorage (set by checkout).
 */
(function() {
  var ORDER_KEY = 'orgGrayRockLastOrder';

  function formatPrice(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function init() {
    var contentEl = document.getElementById('confirmationContent');
    var emptyEl = document.getElementById('confirmationEmpty');
    var orderEl = document.getElementById('confirmationOrder');

    var orderJson;
    try {
      orderJson = sessionStorage.getItem(ORDER_KEY);
    } catch (e) {
      orderJson = null;
    }

    if (!orderJson) {
      if (contentEl) contentEl.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    var order;
    try {
      order = JSON.parse(orderJson);
    } catch (e) {
      if (contentEl) contentEl.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    if (orderEl && order.items && order.items.length) {
      var total = 0;
      orderEl.innerHTML =
        '<div class="confirmation-items">' +
        order.items.map(function(item) {
          var lineTotal = item.price * (item.qty || 1);
          total += lineTotal;
          return '<div class="confirmation-item">' +
            '<span class="confirmation-item-name">' + escapeHtml(item.name) + ' × ' + item.qty + '</span>' +
            '<span class="confirmation-item-price">' + formatPrice(lineTotal) + '</span>' +
          '</div>';
        }).join('') +
        '</div>' +
        '<div class="confirmation-total">Total: <strong>' + formatPrice(order.total || total) + '</strong></div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
