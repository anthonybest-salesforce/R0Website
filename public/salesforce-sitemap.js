/**
 * Gray Rock - Salesforce Personalization / Data Cloud
 * Single source of truth for sitemap and all interaction events.
 *
 * Sitemap format matches Salesforce Example Sitemap:
 * https://developer.salesforce.com/docs/marketing/einstein-personalization/guide/example-sitemap.html
 *
 * Upload to Data Cloud: Websites & Mobile Apps → your website → Sitemap → Upload
 * Or copy the sitemapConfig object into the paste box.
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
// Format matches Salesforce Example Sitemap: https://developer.salesforce.com/docs/marketing/einstein-personalization/guide/example-sitemap.html
var sitemapConfig = {
  pageTypeDefault: {
    name: "default",
    interaction: {
      name: "default",
      eventType: "userEngagement"
    }
  },
  pageTypes: [
    {
      name: "home",
      isMatch: function() { return window.location.pathname === "/" || window.location.pathname === "/index.html" || window.location.pathname.endsWith("/index.html"); },
      interaction: {
        name: "home view",
        eventType: "userEngagement"
      },
      contentZones: [
        { name: "hero_banner", selector: ".hero-content" },
        { name: "product_recommendations", selector: "section.section-dark .recommendations-grid" },
        { name: "content_recommendations", selector: "section.section-alt .recommendations-grid" }
      ]
    },
    {
      name: "shop",
      isMatch: function() { return window.location.pathname.indexOf("/shop") !== -1; },
      interaction: {
        name: "shop view",
        eventType: "userEngagement"
      },
      contentZones: [
        { name: "shop_grid", selector: "#shopGrid" }
      ]
    },
    {
      name: "product",
      isMatch: function() { return window.location.pathname.indexOf("/product") !== -1; },
      interaction: {
        name: "product view",
        eventType: "userEngagement"
      },
      contentZones: [
        { name: "product_detail", selector: ".product-detail" }
      ]
    },
    {
      name: "learn",
      isMatch: function() { return window.location.pathname.indexOf("/learn") !== -1; },
      interaction: {
        name: "learn view",
        eventType: "userEngagement"
      },
      contentZones: [
        { name: "learn_articles", selector: ".learn-articles" },
        { name: "learn_recommended", selector: ".learn-recommended-grid" }
      ]
    },
    {
      name: "connect",
      isMatch: function() { return window.location.pathname.indexOf("/connect") !== -1; },
      interaction: {
        name: "connect view",
        eventType: "userEngagement"
      }
    },
    {
      name: "signin",
      isMatch: function() { return window.location.pathname.indexOf("/signin") !== -1; },
      interaction: {
        name: "signin view",
        eventType: "userEngagement"
      }
    },
    {
      name: "signup",
      isMatch: function() { return window.location.pathname.indexOf("/signup") !== -1; },
      interaction: {
        name: "signup view",
        eventType: "userEngagement"
      }
    },
    {
      name: "account",
      isMatch: function() { return window.location.pathname.indexOf("/account") !== -1; },
      interaction: {
        name: "account view",
        eventType: "userEngagement"
      },
      contentZones: [
        { name: "order_recommendations", selector: ".account-section" }
      ]
    },
    {
      name: "checkout",
      isMatch: function() { return window.location.pathname.indexOf("/checkout") !== -1; },
      interaction: {
        name: "checkout view",
        eventType: "userEngagement"
      }
    },
    {
      name: "order-confirmation",
      isMatch: function() { return window.location.pathname.indexOf("/order-confirmation") !== -1; },
      interaction: {
        name: "order confirmation view",
        eventType: "userEngagement"
      }
    },
    {
      name: "admin",
      isMatch: function() { return window.location.pathname.indexOf("/admin") !== -1; },
      interaction: {
        name: "admin view",
        eventType: "userEngagement"
      }
    }
  ]
};

// ─── All Salesforce event functions (single source of truth) ─────────────────

function sendAddToCart(productId, productName, price, qty) {
  var SI = window.SalesforceInteractions;
  if (!SI || typeof SI.sendEvent !== 'function') return;
  try {
    var names = INTERACTION_NAMES.cart;
    var name = (names && names.AddToCart) || (SI.CartInteractionName ? SI.CartInteractionName.AddToCart : 'Add To Cart');
    SI.sendEvent({
      interaction: {
        name: name,
        lineItem: {
          catalogObjectType: 'Add To Cart',
          catalogObjectId: productId,
          quantity: qty,
          price: parseFloat(price) || 0,
          currency: 'USD'
        }
      }
    });
  } catch (e) {
    console.warn('[Gray Rock] sendEvent AddToCart failed:', e);
  }
}

function sendReplaceCart(items) {
  var SI = window.SalesforceInteractions;
  if (!SI || typeof SI.sendEvent !== 'function') return;
  try {
    var names = INTERACTION_NAMES.cart;
    var name = (names && names.ReplaceCart) || (SI.CartInteractionName ? SI.CartInteractionName.ReplaceCart : 'Replace Cart');
    var lineItems = (items || []).map(function(i) {
      return {
        catalogObjectType: 'Remove From Cart',
        catalogObjectId: i.id,
        quantity: i.qty || 1,
        price: parseFloat(i.price) || 0,
        currency: 'USD'
      };
    });
    SI.sendEvent({
      interaction: {
        name: name,
        lineItems: lineItems
      }
    });
  } catch (e) {
    console.warn('[Gray Rock] sendEvent ReplaceCart failed:', e);
  }
}

function sendPurchase(orderId, total, cart) {
  var SI = window.SalesforceInteractions;
  if (!SI || typeof SI.sendEvent !== 'function') return;
  try {
    var names = INTERACTION_NAMES.order;
    var purchaseName = (names && names.Purchase) || (SI.OrderInteractionName ? SI.OrderInteractionName.Purchase : 'Purchase');
    SI.sendEvent({
      interaction: {
        name: purchaseName,
        order: {
          id: orderId || 'RZ-' + Date.now(),
          totalValue: total,
          currency: 'USD',
          lineItems: (cart || []).map(function(i) {
            return {
              catalogObjectType: 'Product',
              catalogObjectId: i.id,
              quantity: i.qty || 1,
              price: parseFloat(i.price) || 0,
              currency: 'USD'
            };
          })
        }
      }
    });
  } catch (err) {
    console.warn('[Gray Rock] sendEvent Purchase failed:', err);
  }
}

function sendSignIn(email) {
  var SI = window.SalesforceInteractions;
  if (!SI || typeof SI.sendEvent !== 'function') return;
  try {
    SI.setIdentity({ identifiers: [{ type: 'email', value: email }] });
    SI.sendEvent({
      interaction: { name: 'signIn', eventType: 'signIn' },
      user: {
        identities: { email: email },
        attributes: { emailAddress: email }
      }
    });
  } catch (err) {
    console.warn('[Gray Rock] signIn sendEvent failed:', err);
  }
}

function sendCreateAccount(payload) {
  var SI = window.SalesforceInteractions;
  if (!SI || typeof SI.sendEvent !== 'function') return;
  try {
    SI.setIdentity({ identifiers: [{ type: 'email', value: payload.email }] });
    SI.sendEvent({
      interaction: {
        name: 'createAccount',
        eventType: 'createAccount',
        leadSource: 'Gray Rock Website'
      },
      user: {
        identities: { email: payload.email },
        attributes: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          emailAddress: payload.email,
          phone: payload.phone || undefined,
          optInEmail: payload.optInEmail === true,
          optInSms: payload.optInSms === true
        }
      }
    });
  } catch (err) {
    console.warn('[Gray Rock] createAccount sendEvent failed:', err);
  }
}

function sendWebToLead(data) {
  var SI = window.SalesforceInteractions;
  if (!SI || typeof SI.sendEvent !== 'function') return;
  try {
    var name = INTERACTION_NAMES.lead || 'webToLead';
    SI.sendEvent({
      interaction: {
        name: name,
        eventType: name,
        company: data.company || undefined,
        phone: data.phone || undefined,
        message: data.message || undefined,
        leadSource: 'Gray Rock Website'
      },
      user: {
        identities: { email: data.email },
        attributes: {
          firstName: data.firstName,
          lastName: data.lastName,
          emailAddress: data.email
        }
      }
    });
  } catch (err) {
    console.warn('[Gray Rock] sendEvent webToLead failed:', err);
  }
}

function sendAccountView(me) {
  var SI = window.SalesforceInteractions;
  if (!me || !me.email || !SI || typeof SI.sendEvent !== 'function') return;
  try {
    SI.setIdentity({ identifiers: [{ type: 'email', value: me.email }] });
    var attrs = { emailAddress: me.email };
    if (me.firstName) attrs.firstName = me.firstName;
    if (me.lastName) attrs.lastName = me.lastName;
    if (me.phone) attrs.phone = me.phone;
    if (me.optInEmail !== undefined) attrs.optInEmail = me.optInEmail;
    if (me.optInSms !== undefined) attrs.optInSms = me.optInSms;
    SI.sendEvent({
      interaction: { name: 'account view', eventType: 'userEngagement' },
      user: {
        identities: { email: me.email },
        attributes: attrs
      }
    });
  } catch (e) {
    console.warn('[Gray Rock] setIdentity/sendEvent accountView failed:', e);
  }
}

// Browser: expose for salesforce-init.js and other scripts
if (typeof window !== 'undefined') {
  window.orgGrayRockSitemapConfig = sitemapConfig;
  window.orgGrayRockInteractionNames = INTERACTION_NAMES;
  window.orgGrayRockSalesforce = {
    sendAddToCart: sendAddToCart,
    sendReplaceCart: sendReplaceCart,
    sendPurchase: sendPurchase,
    sendSignIn: sendSignIn,
    sendCreateAccount: sendCreateAccount,
    sendWebToLead: sendWebToLead,
    sendAccountView: sendAccountView
  };
}

// Node / Data Cloud upload (sitemapConfig for paste box; full export for programmatic use)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = sitemapConfig;
  module.exports.INTERACTION_NAMES = INTERACTION_NAMES;
  module.exports.sendAddToCart = sendAddToCart;
  module.exports.sendReplaceCart = sendReplaceCart;
  module.exports.sendPurchase = sendPurchase;
  module.exports.sendSignIn = sendSignIn;
  module.exports.sendCreateAccount = sendCreateAccount;
  module.exports.sendWebToLead = sendWebToLead;
  module.exports.sendAccountView = sendAccountView;
}