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

      var sitemapConfig = {
        global: {
          onActionEvent: function(actionEvent) {
            var name = (actionEvent && actionEvent.interaction && actionEvent.interaction.name) || 'userEngagement';
            dispatchSalesforceEvent('pageView', { interaction: name });
            return actionEvent;
          }
        },
        pageTypeDefault: {
          name: 'default',
          interaction: { name: 'default', eventType: 'userEngagement' }
        },
        pageTypes: [
          {
            name: 'home',
            isMatch: function() {
              var p = window.location.pathname;
              return p === '/' || p === '/index.html' || p.endsWith('/index.html');
            },
            interaction: { name: 'home view', eventType: 'userEngagement' },
            contentZones: [
              { name: 'hero_banner', selector: '.hero-content' },
              { name: 'product_recommendations', selector: '.section-dark .recommendations-grid' },
              { name: 'content_recommendations', selector: '.section-alt .recommendations-grid' }
            ]
          },
          {
            name: 'signin',
            isMatch: function() { return window.location.pathname.includes('signin'); },
            interaction: { name: 'signin view', eventType: 'userEngagement' }
          },
          {
            name: 'account',
            isMatch: function() { return window.location.pathname.includes('account'); },
            interaction: { name: 'account view', eventType: 'userEngagement' },
            contentZones: [
              { name: 'order_recommendations', selector: '.account-section' }
            ]
          },
          {
            name: 'shop',
            isMatch: function() { return window.location.pathname.includes('shop'); },
            interaction: { name: 'shop view', eventType: 'userEngagement' },
            contentZones: [{ name: 'shop_grid', selector: '#shopGrid' }]
          },
          {
            name: 'product',
            isMatch: function() { return window.location.pathname.includes('product'); },
            interaction: { name: 'product view', eventType: 'userEngagement' },
            contentZones: [{ name: 'product_detail', selector: '.product-detail' }]
          },
          {
            name: 'learn',
            isMatch: function() { return window.location.pathname.includes('learn'); },
            interaction: { name: 'learn view', eventType: 'userEngagement' },
            contentZones: [
              { name: 'learn_articles', selector: '.learn-articles' },
              { name: 'learn_recommended', selector: '.learn-recommended-grid' }
            ]
          },
          {
            name: 'connect',
            isMatch: function() { return window.location.pathname.includes('connect'); },
            interaction: { name: 'connect view', eventType: 'userEngagement' }
          },
          {
            name: 'checkout',
            isMatch: function() { return window.location.pathname.includes('checkout'); },
            interaction: { name: 'checkout view', eventType: 'userEngagement' }
          },
          {
            name: 'order-confirmation',
            isMatch: function() { return window.location.pathname.includes('order-confirmation'); },
            interaction: { name: 'order confirmation view', eventType: 'userEngagement' }
          },
          {
            name: 'signup',
            isMatch: function() { return window.location.pathname.includes('signup'); },
            interaction: { name: 'signup view', eventType: 'userEngagement' }
          },
          {
            name: 'admin',
            isMatch: function() { return window.location.pathname.includes('admin'); },
            interaction: { name: 'admin view', eventType: 'userEngagement' }
          }
        ]
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
