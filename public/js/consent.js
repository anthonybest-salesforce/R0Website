/**
 * Gray Rock - Consent popup for Salesforce Data Cloud
 * Collects user consent and sends it to Data Cloud via the Salesforce Interactions SDK.
 */
(function() {
  var CONSENT_KEY = 'orgGrayRockConsent';
  var CONSENT_ACCEPTED = 'accepted';
  var CONSENT_REJECTED = 'rejected';

  function getStoredConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY);
    } catch (e) {
      return null;
    }
  }

  function setStoredConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch (e) {
      console.warn('[Gray Rock] Could not store consent:', e);
    }
  }

  function createPopup() {
    var existing = document.getElementById('consentOverlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'consent-overlay';
    overlay.id = 'consentOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-labelledby', 'consentTitle');
    overlay.setAttribute('aria-describedby', 'consentDesc');

    overlay.innerHTML = '<div class="consent-modal">' +
      '<h2 id="consentTitle" class="consent-title">We value your privacy</h2>' +
      '<p id="consentDesc" class="consent-desc">Gray Rock uses cookies and similar technologies to improve your experience, personalize content, and analyze site traffic. Your data helps us deliver better recommendations. Do you consent to this tracking?</p>' +
      '<div class="consent-actions">' +
        '<button type="button" class="btn btn-outline" id="consentReject">Reject</button>' +
        '<button type="button" class="btn btn-primary" id="consentAccept">Accept</button>' +
      '</div>' +
      '<p class="consent-footer"><a href="#" id="consentLearnMore">Learn more</a></p>' +
    '</div>';

    document.body.appendChild(overlay);
    return overlay;
  }

  function showPopup() {
    var overlay = createPopup();
    overlay.classList.add('consent-overlay-visible');

    document.getElementById('consentAccept').addEventListener('click', function() {
      setStoredConsent(CONSENT_ACCEPTED);
      overlay.classList.remove('consent-overlay-visible');
      setTimeout(function() { overlay.remove(); }, 300);
      dispatchConsentReady(CONSENT_ACCEPTED);
    });

    document.getElementById('consentReject').addEventListener('click', function() {
      setStoredConsent(CONSENT_REJECTED);
      overlay.classList.remove('consent-overlay-visible');
      setTimeout(function() { overlay.remove(); }, 300);
      dispatchConsentReady(CONSENT_REJECTED);
    });

    document.getElementById('consentLearnMore').addEventListener('click', function(e) {
      e.preventDefault();
      window.open('index.html#faq', '_blank');
    });
  }

  function showConsentPopup() {
    showPopup();
  }

  window.orgGrayRockShowConsentPopup = showConsentPopup;

  function clearAllCookies() {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var name = cookies[i].split('=')[0].trim();
      if (name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      }
    }
  }

  function clearSiteData() {
    try {
      localStorage.removeItem(CONSENT_KEY);
      localStorage.removeItem('orgGrayRockCart');
      localStorage.removeItem('heroImageIndex');
      localStorage.removeItem('eventConsoleOpen');
      localStorage.removeItem('eventConsolePosition');
    } catch (e) {}
  }

  function resetAndRefresh(e) {
    if (!e.target.closest('.logo-link')) return;
    e.preventDefault();
    clearAllCookies();
    clearSiteData();
    window.location.reload();
  }

  document.addEventListener('click', resetAndRefresh);

  function dispatchConsentReady(status) {
    document.dispatchEvent(new CustomEvent('orgGrayRockConsentReady', {
      detail: { status: status }
    }));
  }

  function init() {
    var stored = getStoredConsent();
    if (stored === CONSENT_ACCEPTED || stored === CONSENT_REJECTED) {
      dispatchConsentReady(stored);
    } else {
      showPopup();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
