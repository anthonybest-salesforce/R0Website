/**
 * Gray Rock - Salesforce Personalization / Data Cloud
 * Single source of truth for sitemap and all interaction events.
 *
 * Upload to Data Cloud: Websites & Mobile Apps → your website → Sitemap → Upload
 * Or copy the sitemapConfig object into the paste box.
 *
 * Path patterns match against window.location.pathname (e.g. /shop, /product.html).
 */

// ─── All interaction events used across Gray Rock ───────────────────────────
var INTERACTION_NAMES = {
  // Page views (userEngagement)
  pageViews: [
    'default',
    'home view',
    'signin view',
    'account view',
    'shop view',
    'product view',
    'learn view',
    'connect view',
    'checkout view',
    'order confirmation view',
    'signup view',
    'admin view'
  ],
  // Cart (cart.js)
  cart: { AddToCart: 'Add To Cart', ReplaceCart: 'Replace Cart' },
  // Order (checkout.js)
  order: { Purchase: 'Purchase' },
  // Auth (signin.html)
  auth: ['signIn', 'createAccount'],
  // Lead (connect.js)
  lead: 'webToLead'
};

// ─── Sitemap config (page types + content zones) ─────────────────────────────
var sitemapConfig = {
  pageTypeDefault: {
    name: 'default',
    interaction: {
      name: 'default',
      eventType: 'userEngagement'
    }
  },
  pageTypes: [
    {
      name: 'home',
      pathPattern: '^\\/?$|\\/index\\.html$',
      interaction: {
        name: 'home view',
        eventType: 'userEngagement'
      },
      contentZones: [
        { name: 'hero_banner', selector: '.hero-content' },
        { name: 'product_recommendations', selector: '.section-dark .recommendations-grid' },
        { name: 'content_recommendations', selector: '.section-alt .recommendations-grid' }
      ]
    },
    {
      name: 'shop',
      pathPattern: '\\/shop',
      interaction: {
        name: 'shop view',
        eventType: 'userEngagement'
      },
      contentZones: [
        { name: 'shop_grid', selector: '#shopGrid' }
      ]
    },
    {
      name: 'product',
      pathPattern: '\\/product',
      interaction: {
        name: 'product view',
        eventType: 'userEngagement'
      },
      contentZones: [
        { name: 'product_detail', selector: '.product-detail' }
      ]
    },
    {
      name: 'learn',
      pathPattern: '\\/learn',
      interaction: {
        name: 'learn view',
        eventType: 'userEngagement'
      },
      contentZones: [
        { name: 'learn_articles', selector: '.learn-articles' },
        { name: 'learn_recommended', selector: '.learn-recommended-grid' }
      ]
    },
    {
      name: 'connect',
      pathPattern: '\\/connect',
      interaction: {
        name: 'connect view',
        eventType: 'userEngagement'
      }
    },
    {
      name: 'signin',
      pathPattern: '\\/signin',
      interaction: {
        name: 'signin view',
        eventType: 'userEngagement'
      }
    },
    {
      name: 'signup',
      pathPattern: '\\/signup',
      interaction: {
        name: 'signup view',
        eventType: 'userEngagement'
      }
    },
    {
      name: 'account',
      pathPattern: '\\/account',
      interaction: {
        name: 'account view',
        eventType: 'userEngagement'
      },
      contentZones: [
        { name: 'order_recommendations', selector: '.account-section' }
      ]
    },
    {
      name: 'checkout',
      pathPattern: '\\/checkout',
      interaction: {
        name: 'checkout view',
        eventType: 'userEngagement'
      }
    },
    {
      name: 'order-confirmation',
      pathPattern: '\\/order-confirmation',
      interaction: {
        name: 'order confirmation view',
        eventType: 'userEngagement'
      }
    },
    {
      name: 'admin',
      pathPattern: '\\/admin',
      interaction: {
        name: 'admin view',
        eventType: 'userEngagement'
      }
    }
  ]
};

// Convert pathPattern to isMatch for runtime (SI.initSitemap)
function toRuntimeSitemap(config) {
  var pageTypes = (config.pageTypes || []).map(function(p) {
    var pattern = p.pathPattern;
    var isMatch = typeof pattern === 'string'
      ? function() {
          try {
            return new RegExp(pattern).test(window.location.pathname || '');
          } catch (e) {
            return false;
          }
        }
      : (p.isMatch || function() { return false; });
    return {
      name: p.name,
      isMatch: isMatch,
      interaction: p.interaction,
      contentZones: p.contentZones
    };
  });
  return {
    pageTypeDefault: config.pageTypeDefault,
    pageTypes: pageTypes
  };
}

// Browser: expose for salesforce-init.js
if (typeof window !== 'undefined') {
  window.orgGrayRockSitemapConfig = sitemapConfig;
  window.orgGrayRockInteractionNames = INTERACTION_NAMES;
  window.orgGrayRockToRuntimeSitemap = toRuntimeSitemap;
}

// Node / Data Cloud upload (sitemapConfig for paste box; full export for programmatic use)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = sitemapConfig;
  module.exports.INTERACTION_NAMES = INTERACTION_NAMES;
  module.exports.toRuntimeSitemap = toRuntimeSitemap;
}
