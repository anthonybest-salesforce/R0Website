/**
 * Gray Rock - Salesforce Interactions SDK initialization
 * Integrates with Salesforce Personalization and Data 360.
 * Waits for user consent before initializing; sends consent to Data Cloud.
 * CDN script and consent.js must load before this file.
 */
(function() {
  if (typeof window.SalesforceInteractions === 'undefined') {
    console.warn('[Gray Rock] Salesforce SDK not loaded');
    return;
  }

  var SI = window.SalesforceInteractions;
  var CONSENT_ACCEPTED = 'accepted';
  var initialized = false;

  function logAction(action, detail) {
    var msg = '[Gray Rock] Salesforce Personalization: ' + action;
    if (detail) msg += ' — ' + detail;
    console.log('%c' + msg, 'color: orange; font-weight: 500');
  }

  function getPageViewFromPathname() {
    var p = (window.location && window.location.pathname) || '';
    if (p === '/' || p === '/index.html') return 'home view';
    if (p.includes('signin')) return 'signin view';
    if (p.includes('account')) return 'account view';
    if (p.includes('shop')) return 'shop view';
    if (p.includes('product')) return 'product view';
    if (p.includes('learn')) return 'learn view';
    if (p.includes('connect')) return 'connect view';
    if (p.includes('checkout')) return 'checkout view';
    if (p.includes('order-confirmation')) return 'order confirmation view';
    if (p.includes('signup')) return 'signup view';
    if (p.includes('admin')) return 'admin view';
    return 'default';
  }

  function dispatchPageViewNow() {
    var viewName = getPageViewFromPathname();
    // Defer so console.js (which runs on DOMContentLoaded) has time to attach its listener
    setTimeout(function() {
      document.dispatchEvent(new CustomEvent('orgGrayRockSalesforceEvent', {
        detail: { type: 'pageView', detail: { interaction: viewName } }
      }));
    }, 0);
  }

  function initWithConsent(consentStatus) {
    dispatchPageViewNow();

    if (initialized) {
      // User changed consent via Cookie preferences
      var isOptIn = consentStatus === CONSENT_ACCEPTED;
      logAction('updateConsents', (isOptIn ? 'OptIn' : 'OptOut') + ' (cookie preferences)');
      SI.updateConsents([{
        purpose: SI.ConsentPurpose.Tracking,
        provider: 'Gray Rock',
        status: isOptIn ? SI.ConsentStatus.OptIn : SI.ConsentStatus.OptOut
      }]);
      document.dispatchEvent(new CustomEvent('orgGrayRockSalesforceEvent', {
        detail: { type: 'consent', detail: { status: isOptIn ? 'OptIn' : 'OptOut' } }
      }));
      return;
    }
    var isOptIn = consentStatus === CONSENT_ACCEPTED;
    logAction('init', 'consent=' + (isOptIn ? 'OptIn' : 'OptOut'));

    // Initialize Personalization module (MUST be before init)
    logAction('Personalization.Config.initialize', 'dataspace=default');
    SI.Personalization.Config.initialize({
      additionalTransformers: [],
      personalizationExperienceConfigs: [],
      customFlickerDefenseConfig: [],
      customEngagementConfig: []
    });

    logAction('SI.init', 'personalization dataspace=default');
    document.dispatchEvent(new CustomEvent('orgGrayRockSalesforceEvent', {
      detail: { type: 'consent', detail: { status: isOptIn ? 'OptIn' : 'OptOut' } }
    }));
    SI.init({
      personalization: { dataspace: 'default' },
      consents: [
        {
          purpose: SI.ConsentPurpose.Tracking,
          provider: 'Gray Rock',
          status: isOptIn ? SI.ConsentStatus.OptIn : SI.ConsentStatus.OptOut
        }
      ]
    }).then(function() {
      function dispatchSalesforceEvent(type, detail) {
        document.dispatchEvent(new CustomEvent('orgGrayRockSalesforceEvent', {
          detail: { type: type, detail: detail }
        }));
      }

      var origSendEvent = SI.sendEvent;
      if (typeof origSendEvent === 'function') {
        SI.sendEvent = function(payload) {
          var interaction = payload && payload.interaction;
          var name = (interaction && interaction.name) || 'sendEvent';
          var isPageView = interaction && interaction.eventType === 'userEngagement' && !interaction.lineItem && !interaction.lineItems && !interaction.order;
          var isSignInOrCreateAccount = name === 'signIn' || name === 'createAccount';
          if (!isPageView && !isSignInOrCreateAccount) {
            dispatchSalesforceEvent('sendEvent', { interaction: name, payload: payload });
          }
          return origSendEvent.apply(this, arguments);
        };
      }

      var rawConfig = (typeof window.orgGrayRockSitemapConfig !== 'undefined')
        ? window.orgGrayRockSitemapConfig
        : null;
      if (!rawConfig) {
        console.warn('[Gray Rock] salesforce-sitemap.js must load before salesforce-init.js');
      }
      var sitemapConfig = rawConfig || { pageTypeDefault: { name: 'default', interaction: { name: 'default', eventType: 'userEngagement' } }, pageTypes: [] };
      sitemapConfig.global = {
        onActionEvent: function(actionEvent) {
          var name = (actionEvent && actionEvent.interaction && actionEvent.interaction.name) || 'userEngagement';
          dispatchSalesforceEvent('pageView', { interaction: name });
          return actionEvent;
        }
      };
      logAction('initSitemap', 'pageTypes: home, shop, product, learn, connect, signin, signup, account, checkout, order-confirmation, admin');
      SI.initSitemap(sitemapConfig);

      // Send pageView to SDK (console already got it from dispatchPageViewNow)
      var pageTypes = sitemapConfig.pageTypes.concat([{ name: 'default', isMatch: function() { return true; }, interaction: { name: 'default', eventType: 'userEngagement' } }]);
      var matched = pageTypes.find(function(p) { return p.isMatch && p.isMatch(); });
      var interaction = (matched && matched.interaction) ? matched.interaction : sitemapConfig.pageTypeDefault.interaction;
      SI.sendEvent({ interaction: interaction });
      logAction('sendEvent', 'pageView: ' + (interaction.name || 'default'));

      // Personalization.fetch for content zones (identity set by account.js when user loads)
      var zonesByPage = {
        home: ['hero_banner', 'product_recommendations', 'content_recommendations'],
        account: ['order_recommendations'],
        shop: ['shop_grid'],
        product: ['product_detail'],
        learn: ['learn_articles', 'learn_recommended']
      };
      var p = window.location.pathname;
      var zones = p === '/' || p.endsWith('/index.html') ? zonesByPage.home
        : p.includes('account') ? zonesByPage.account
        : p.includes('shop') ? zonesByPage.shop
        : p.includes('product') ? zonesByPage.product
        : p.includes('learn') ? zonesByPage.learn
        : [];
      if (zones.length && SI.Personalization && typeof SI.Personalization.fetch === 'function') {
        SI.Personalization.fetch(zones).then(function(res) {
          if (res && Object.keys(res).length) logAction('Personalization.fetch', zones.join(', '));
        }).catch(function() {});
      }
    }).then(function() {
      initialized = true;
      logAction('init complete', 'Personalization ready');
    }).catch(function(err) {
      console.error('%c[Gray Rock] Salesforce SDK init failed:', 'color: orange; font-weight: 500', err);
    });
  }

  function onConsentReady(e) {
    var status = e.detail && e.detail.status ? e.detail.status : CONSENT_ACCEPTED;
    logAction('consent received', 'status=' + status);
    initWithConsent(status);
  }

  document.addEventListener('orgGrayRockConsentReady', onConsentReady);
})();
