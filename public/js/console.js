(function() {
  const CONSOLE_OPEN_KEY = 'eventConsoleOpen';
  const CONSOLE_POSITION_KEY = 'eventConsolePosition';
  const CONSOLE_LOG_KEY = 'eventConsoleLog';
  const MAX_ENTRIES = 100;

  function getStoredLog() {
    try {
      var raw = sessionStorage.getItem(CONSOLE_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLog(entries) {
    try {
      sessionStorage.setItem(CONSOLE_LOG_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
    } catch (e) {}
  }

  function initConsole() {
    const consoleBtn = document.getElementById('consoleBtn');
    const consolePanel = document.getElementById('eventConsole');
    const consoleOutput = document.getElementById('eventOutput');
    const consoleClose = document.getElementById('consoleClose');
    const consoleClear = document.getElementById('consoleClear');
    const consoleToggle = document.getElementById('consoleToggle');

    if (!consoleBtn || !consolePanel || !consoleOutput) return;

    let isListening = false;
    let listeners = [];

    function updateToggleButton() {
      if (!consoleToggle) return;
      const isLeft = consolePanel.classList.contains('event-console-left');
      consoleToggle.textContent = isLeft ? '→' : '←';
      consoleToggle.setAttribute('aria-label', isLeft ? 'Move console to right' : 'Move console to left');
    }

    function setPosition(isLeft) {
      if (isLeft) {
        consolePanel.classList.add('event-console-left');
      } else {
        consolePanel.classList.remove('event-console-left');
      }
      localStorage.setItem(CONSOLE_POSITION_KEY, isLeft ? 'left' : 'right');
      updateToggleButton();
      updateBodyShift();
    }

    function togglePosition() {
      const isLeft = consolePanel.classList.contains('event-console-left');
      setPosition(!isLeft);
    }

    function formatTime() {
      return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    }

    function logEvent(type, detail) {
      detail = detail || '';
      var time = formatTime();
      var entry = document.createElement('div');
      entry.className = 'event-entry';
      entry.innerHTML = '<span class="event-time">' + time + '</span> <span class="event-type">' + type + '</span>' + (detail ? ' <span class="event-detail">' + detail + '</span>' : '');
      consoleOutput.insertBefore(entry, consoleOutput.firstChild);
      var stored = getStoredLog();
      stored.push({ time: time, type: type, detail: detail });
      if (stored.length > MAX_ENTRIES) stored.shift();
      saveLog(stored);
      if (consoleOutput.children.length > MAX_ENTRIES) {
        consoleOutput.removeChild(consoleOutput.lastChild);
      }
    }

    function formatSalesforceDetail(d) {
      if (!d) return '';
      var parts = [];
      if (d.interaction) parts.push(d.interaction);
      if (d.payload) {
        var p = d.payload;
        if (p.interaction && p.interaction.lineItem) {
          var li = p.interaction.lineItem;
          parts.push(li.catalogObjectId + ' ×' + (li.quantity || 1));
        } else if (p.interaction && p.interaction.lineItems && p.interaction.lineItems.length) {
          parts.push(p.interaction.lineItems.length + ' item(s)');
        } else if (p.interaction && p.interaction.order) {
          var o = p.interaction.order;
          parts.push('#' + (o.id || '') + ' $' + (o.totalValue || 0));
        } else if (p.user && p.user.attributes) {
          var u = p.user.attributes;
          if (u.emailAddress) parts.push('email=' + u.emailAddress);
          if (u.firstName) parts.push(u.firstName);
          if (u.lastName) parts.push(u.lastName);
          if (u.phone) parts.push('phone=' + u.phone);
          if (u.optInEmail) parts.push('optInEmail');
          if (u.optInSms) parts.push('optInSms');
        }
      }
      if (d.status) parts.push(d.status);
      if (d.email) parts.push('email=' + d.email);
      return parts.length ? parts.join(' ') : (d.interaction || JSON.stringify(d));
    }

    function onSalesforceEvent(e) {
      var d = e.detail;
      if (!d || !d.type) return;
      var detail = formatSalesforceDetail(d.detail);
      logEvent(d.type, detail);
    }

    function startListening() {
      if (isListening) return;
      isListening = true;
      document.addEventListener('orgGrayRockSalesforceEvent', onSalesforceEvent);
      listeners.push({ name: 'orgGrayRockSalesforceEvent', fn: onSalesforceEvent });
      var stored = getStoredLog();
      var hasListening = stored.some(function(e) { return e.type === 'system' && (e.detail || '').indexOf('Listening') >= 0; });
      if (!hasListening) {
        logEvent('system', 'Listening for Salesforce Data Cloud / Personalization events');
      }
    }

    function stopListening() {
      listeners.forEach(function(l) {
        document.removeEventListener(l.name, l.fn);
      });
      listeners = [];
      isListening = false;
    }

    function updateBodyShift() {
      var isOpen = consolePanel.classList.contains('event-console-open');
      var isLeft = consolePanel.classList.contains('event-console-left');
      document.body.classList.remove('event-console-open', 'event-console-left');
      if (isOpen) {
        document.body.classList.add('event-console-open');
        if (isLeft) document.body.classList.add('event-console-left');
      }
    }

    function openConsole() {
      consolePanel.classList.add('event-console-open');
      consolePanel.setAttribute('aria-hidden', 'false');
      localStorage.setItem(CONSOLE_OPEN_KEY, 'true');
      updateToggleButton();
      updateBodyShift();
    }

    function closeConsole() {
      consolePanel.classList.remove('event-console-open');
      consolePanel.setAttribute('aria-hidden', 'true');
      localStorage.setItem(CONSOLE_OPEN_KEY, 'false');
      updateBodyShift();
    }

    consoleBtn.addEventListener('click', () => {
      const isOpen = consolePanel.classList.contains('event-console-open');
      if (isOpen) {
        closeConsole();
      } else {
        openConsole();
      }
    });

    if (consoleClose) {
      consoleClose.addEventListener('click', closeConsole);
    }

    if (consoleToggle) {
      consoleToggle.addEventListener('click', togglePosition);
    }

    if (consoleClear) {
      consoleClear.addEventListener('click', function() {
        consoleOutput.innerHTML = '';
        saveLog([]);
      });
    }

    // Restore event log from previous pages (persists across navigation)
    var stored = getStoredLog();
    for (var i = stored.length - 1; i >= 0; i--) {
      var e = stored[i];
      var div = document.createElement('div');
      div.className = 'event-entry';
      div.innerHTML = '<span class="event-time">' + e.time + '</span> <span class="event-type">' + e.type + '</span>' + (e.detail ? ' <span class="event-detail">' + e.detail + '</span>' : '');
      consoleOutput.appendChild(div);
    }

    // Always listen for events (captures pageView even when console is closed)
    startListening();

    // Restore console position on page load
    const savedPosition = localStorage.getItem(CONSOLE_POSITION_KEY);
    if (savedPosition === 'left') {
      consolePanel.classList.add('event-console-left');
    }
    updateToggleButton();

    // Restore console state on page load - keep it open across navigation/refresh
    if (localStorage.getItem(CONSOLE_OPEN_KEY) === 'true') {
      openConsole();
    } else {
      updateBodyShift();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConsole);
  } else {
    initConsole();
  }
})();
