/**
 * Gray Rock - Deferred script loader
 * Waits for the Salesforce CDN script (in head) to load, then adds a delay so
 * the SDK can initialize window.SalesforceInteractions before our scripts run.
 */
(function() {
  var SDK_DELAY_MS = 400;
  var scripts = window.orgGrayRockScriptsToLoad || [];
  var onDone = window.orgGrayRockOnScriptsLoaded;

  function loadNext(i) {
    if (i >= scripts.length) {
      if (typeof onDone === 'function') onDone();
      return;
    }
    var s = document.createElement('script');
    s.src = scripts[i];
    s.onload = function() { loadNext(i + 1); };
    s.onerror = function() { loadNext(i + 1); };
    document.body.appendChild(s);
  }

  var sdk = document.getElementById('salesforce-sdk');
  function start() {
    setTimeout(function() { loadNext(0); }, SDK_DELAY_MS);
  }
  if (sdk && sdk.getAttribute('src')) {
    if (sdk.readyState === 'loaded' || sdk.readyState === 'complete') {
      start();
    } else {
      sdk.onload = start;
    }
  } else {
    start();
  }
})();
