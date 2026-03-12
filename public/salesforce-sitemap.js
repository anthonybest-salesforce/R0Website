/**
 * Gray Rock - Salesforce Personalization / Data Cloud Sitemap
 * Upload this file to Data Cloud: Websites & Mobile Apps → your website → Sitemap → Upload
 * Or copy the sitemapConfig object below into the paste box.
 */
const sitemapConfig = {
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
      pathPattern: "^\\/?$|\\/index\\.html$",
      interaction: {
        name: "home view",
        eventType: "userEngagement"
      },
      contentZones: [
        { name: "hero_banner", selector: ".hero-content" },
        { name: "product_recommendations", selector: ".section-dark .recommendations-grid" },
        { name: "content_recommendations", selector: ".section-alt .recommendations-grid" }
      ]
    },
    {
      name: "shop",
      pathPattern: "\\/shop",
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
      pathPattern: "\\/product",
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
      pathPattern: "\\/learn",
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
      pathPattern: "\\/connect",
      interaction: {
        name: "connect view",
        eventType: "userEngagement"
      }
    },
    {
      name: "signin",
      pathPattern: "\\/signin",
      interaction: {
        name: "signin view",
        eventType: "userEngagement"
      }
    },
    {
      name: "account",
      pathPattern: "\\/account",
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
      pathPattern: "\\/checkout",
      interaction: {
        name: "checkout view",
        eventType: "userEngagement"
      }
    },
    {
      name: "order-confirmation",
      pathPattern: "\\/order-confirmation",
      interaction: {
        name: "order confirmation view",
        eventType: "userEngagement"
      }
    },
    {
      name: "signup",
      pathPattern: "\\/signup",
      interaction: {
        name: "signup view",
        eventType: "userEngagement"
      }
    },
    {
      name: "admin",
      pathPattern: "\\/admin",
      interaction: {
        name: "admin view",
        eventType: "userEngagement"
      }
    }
  ]
};

// For upload tools that expect a module export
if (typeof module !== "undefined" && module.exports) {
  module.exports = sitemapConfig;
}
