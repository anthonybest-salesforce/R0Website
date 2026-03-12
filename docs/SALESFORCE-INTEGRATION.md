# Salesforce Personalization & Data 360 Integration Guide

This guide covers integrating the Gray Rock website with **Salesforce Personalization** (Customer 360) and **Salesforce Data 360** using the **Salesforce Interactions SDK**.

---

## Overview

### Salesforce Personalization

[Salesforce Personalization](https://developer.salesforce.com/docs/marketing/einstein-personalization/guide/overview.html) is a Customer 360 application that works with Data Cloud to deliver personalized experiences across Salesforce clouds. It provides:

- **Product recommendations** – Personalized product or content recommendations
- **Goal-based targeting** – Content targeting based on business goals
- **Rule-based targeting** – Content targeting based on rules and segments

Personalization uses Data Cloud data spaces, data graphs, and data model objects (DMOs) to build profiles, calculate insights, and deliver personalized content in real time.

### Data 360

Data 360 (Data Cloud) ingests user interaction data from your website to build behavior profiles, segment audiences, and power personalization. The same **Salesforce Interactions SDK** sends data to both Personalization and Data Cloud.

### How It Works

1. **User interaction data** is ingested via the Salesforce Interactions SDK
2. Data flows into Data Cloud’s real-time and standard layers
3. **Identity resolution** matches or creates user profiles
4. **Real-time insights and segments** are calculated
5. **Personalization** calls the Data Cloud profile API to get the updated profile and return personalized content

---

## Prerequisites

### Required Roles

- **Data Cloud Admin / Architect** – Configures Data Cloud, website connector, data spaces, and schemas
- **Website Developer** – Implements the SDK, sitemap, and personalization rendering

### Required Access

- Salesforce org with **Salesforce Personalization** and **Data Cloud** licenses
- Data Cloud Setup access

---

## Configuration Steps

### Phase 1: Admin/Architect Setup (Data Cloud)

#### 1. Create a Data Space

Data spaces organize data for profile unification, insights, and marketing.

1. Go to **Data Cloud Setup** → **Data Management** → **Data Spaces**
2. Click **New**, name the data space (e.g., `Gray Rock`)
3. Set a unique prefix (1–3 alphanumeric characters)
4. Save

You can use the default data space if you prefer.

#### 2. Create a Website Connector

1. In Data Cloud Setup, go to **Configurations** → **Websites & Mobile Apps**
2. Create a new app of type **Website**
3. Provide a **Connector Name** (e.g., `Gray Rock Website`)
4. Save

#### 3. Map Website Connector Object Fields

Map your website data to Data Cloud objects. The recommended schema covers:

**Engagement events:**
- Consent
- Order
- Catalog
- Cart

**Profile events:**
- Party Identification
- Identity
- Contact Point Phone
- Contact Point Email

#### 4. Create a Website Data Stream

Create a data stream to receive events from the website connector.

#### 5. Upload Event Schema

1. In the website connector, click **Upload Schema**
2. Use `public/web-connector-schema.json` (Gray Rock schema with signIn, createAccount, webToLead) or the [recommended web connector schema](https://cdn.c360a.salesforce.com/cdp/schemas/250/web-connector-schema.json)
3. Ensure required fields: `sessionId`, `category`, `eventType`, `dateTime`, `eventId`, `deviceId`
4. Save and verify mappings

**Gray Rock schema** includes standard events (cart, cartItem, catalog, order, orderItem, consentLog) plus profile events (identity, contactPointEmail, contactPointPhone, partyIdentification) and custom events: **userEngagement** (page views), **signIn**, **createAccount**, **webToLead**.

**Note:** You can only add new events and fields when updating; existing events and fields must remain.

#### 6. Create and Upload Sitemap

1. **XML Sitemap** (for Web Content connector): Available at `/sitemap.xml`. Set `SITE_URL` env var to your production domain (e.g. `https://grayrock-80ac05c6df7e.herokuapp.com`).
2. **Salesforce Personalization Sitemap** (for Websites & Mobile Apps): Use `public/salesforce-sitemap.js` (single file with sitemap + all interaction events). The upload tool accepts a .js file or copy/paste. Upload via Data Cloud Setup → Configuration → Websites & Mobile Apps → your website → Sitemap → Upload.

#### 7. Share with Developer

Provide:

- **CDN URL** – Script URL to load the Interactions SDK (from the website connector)
- **Data space name** – If not using `default`
- **Sitemap** – Or requirements for the developer to build it

**Gray Rock (current):** The CDN URL and tenant configuration are already set. See Phase 2, Step 1 for the script tag and `public/js/salesforce-init.js` for the init and sitemap implementation.

---

### Phase 2: Developer Setup (Website Implementation)

#### 1. Add the SDK Script

Add the script to every page (before your init script). The Gray Rock CDN beacon is pre-configured with the tenant and app source:

```html
<script src="https://cdn.c360a.salesforce.com/beacon/c360a/75a89832-fee6-4979-b0e4-738ab6ed2fa3/scripts/c360a.min.js"></script>
<script src="js/salesforce-init.js"></script>
```

**Gray Rock configuration (embedded in CDN):**

| Setting | Value |
|---------|-------|
| Tenant endpoint | `https://g0ygcmtbh13tszrqgqzwk9l0mm.c360a.salesforce.com` |
| App Source ID | `75a89832-fee6-4979-b0e4-738ab6ed2fa3` |

The CDN script loads the Salesforce Interactions SDK, CDP Event Receiver (Data 360), and Personalization module.

#### 2. Initialize the Personalization Module First

**Important:** Call `SalesforceInteractions.Personalization.Config.initialize()` **before** `SalesforceInteractions.init()`.

```javascript
// Initialize Personalization module (MUST be before init)
SalesforceInteractions.Personalization.Config.initialize({
  additionalTransformers: [
    // Optional: custom transformers for rendering content
  ],
  personalizationExperienceConfigs: [
    // Optional: personalization experiences to include
  ],
  customFlickerDefenseConfig: [
    // Optional: prevent content flicker when loading personalized content
  ],
  customEngagementConfig: [
    // Optional: custom engagement destinations
  ]
});
```

#### 3. Initialize the SDK

```javascript
SalesforceInteractions.init({
  personalization: {
    dataspace: "default"  // or your data space name
  },
  consents: [
    {
      purpose: SalesforceInteractions.ConsentPurpose.Tracking,
      provider: "Gray Rock",
      status: SalesforceInteractions.ConsentStatus.OptIn
    }
  ]
}).then(() => {
  // Sitemap is initialized in the next step
});
```

#### 4. Configure the Sitemap

Define page types, interactions, and content zones:

```javascript
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
      isMatch: () => window.location.pathname === "/" || window.location.pathname === "/index.html",
      interaction: {
        name: "home view",
        eventType: "userEngagement"
      },
      contentZones: [
        { name: "hero_banner", selector: ".hero-content" },
        { name: "recommendations", selector: ".content-grid" }
      ]
    },
    {
      name: "signin",
      isMatch: () => window.location.pathname.includes("signin"),
      interaction: {
        name: "signin view",
        eventType: "userEngagement"
      }
    },
    {
      name: "account",
      isMatch: () => window.location.pathname.includes("account"),
      interaction: {
        name: "account view",
        eventType: "userEngagement"
      },
      contentZones: [
        { name: "order_recommendations", selector: ".account-section" }
      ]
    }
  ]
};

SalesforceInteractions.initSitemap(sitemapConfig);
```

#### 5. Request Personalized Content

Use the Personalization `fetch` method to get personalized content for defined personalization points:

```javascript
SalesforceInteractions.Personalization.fetch(["home_hero", "home_recommendations"])
  .then((personalizationResponse) => {
    // Render personalized content on your website
    console.log("Personalization Response", personalizationResponse);
    // Implement custom logic to display recommendations, hero content, etc.
  });
```

#### 6. Consent Popup and Data Cloud

Gray Rock includes a consent popup that collects user consent before any tracking. Consent is sent to Data Cloud via the SDK:

- **First visit:** A modal asks the user to Accept or Reject tracking.
- **Accept:** SDK initializes with `ConsentStatus.OptIn`; events are sent to Data Cloud.
- **Reject:** SDK initializes with `ConsentStatus.OptOut`; no tracking events are sent.
- **Cookie preferences:** Footer link lets users change their choice; `updateConsents()` sends the new consent to Data Cloud.

Consent is stored in `localStorage` (`orgGray RockConsent`) and persists across sessions. Implementation: `public/js/consent.js`, `public/js/salesforce-init.js`.

#### 7. Set User Identity and Sign-In / Sign-Up Events

**Sign-in:** When a user logs in via the Sign In form (`signin.html`), the site sends:
- `setIdentity` with email
- `sendEvent` with interaction `signIn` and `user.identities` / `user.attributes` (email)

**Sign-up (Create Account):** When a user creates an account, the site sends:
- `setIdentity` with email
- `sendEvent` with interaction `createAccount` and full profile in `user.attributes`:
  - `firstName`, `lastName`, `emailAddress`, `phone`, `optInEmail`, `optInSms`

**Account page:** When a logged-in user loads the account page, the site sends:
- `setIdentity` with email
- `sendEvent` with interaction `accountView` and `user.attributes` (firstName, lastName, phone, optInEmail, optInSms from `/api/me`)

**Data Cloud Admin setup:** Add custom events `signIn` and `createAccount` to your Web Connector schema if you want them in Data Cloud. The `user.attributes` fields map to profile events (Identity, Contact Point Email, Contact Point Phone, etc.) per your schema.

```javascript
SalesforceInteractions.setIdentity({
  identifiers: [
    { type: "email", value: "rmorris@sfse.dev" }
  ]
});
```

#### 8. Web-to-Lead Form (Connect Page)

The Connect page (`/connect`) includes a web-to-lead form that sends lead data to Salesforce Data Cloud SDX as a custom event. On submit, the form calls `SalesforceInteractions.sendEvent()` with:

- **interaction**: `eventType: 'webToLead'`, plus `company`, `phone`, `message`, `leadSource`
- **user**: `identities.email`, `attributes.firstName`, `attributes.lastName`, `attributes.emailAddress`

**Data Cloud Admin setup:** Add a custom event schema for `webToLead` to your Web Connector in Data Cloud Setup:

1. Go to **Data Cloud Setup** → **Configurations** → **Websites & Mobile Apps** → your connector
2. **Upload Schema** or edit the event schema to add a custom event named `webToLead`
3. Include custom fields: `company` (string), `phone` (string), `message` (string), `leadSource` (string)
4. User data (`firstName`, `lastName`, `emailAddress`) is sent via the standard `user` object

The SDK converts field names to camelCase and combines your payload with auto-populated fields (`sessionId`, `deviceId`, `eventId`, `dateTime`, etc.) before sending to the data stream.

Implementation: `public/connect.html`, `public/js/connect.js`.

#### 9. SPA / Client-Side Navigation

For single-page apps or client-side navigation, reinitialize when the URL changes:

```javascript
let currentUrl = window.location.href;
setInterval(() => {
  if (currentUrl !== window.location.href) {
    currentUrl = window.location.href;
    SalesforceInteractions.reinit();
  }
}, 500);
```

---

## Content Zones

Content zones mark areas where personalized content can be rendered. They are defined in the sitemap and exposed in Web Personalization Manager (WPM).

| Field     | Required | Description                                      |
|----------|----------|--------------------------------------------------|
| `name`   | Yes      | Zone identifier (e.g., `hero_banner`, `recommendations`) |
| `selector` | No    | CSS selector for the target element              |

---

## Engagement Tracking

Personalization supports engagement destinations:

- **Product Engagement** – Catalog interactions (e.g., product views)
- **Website Engagement** – Manual content interactions
- **Custom destinations** – For specific tracking needs

See [Track Personalization Engagement](https://developer.salesforce.com/docs/marketing/einstein-personalization/guide/track-personalization-engagement.html) for details.

---

## Environment Variables

| Variable                 | Description                          |
|--------------------------|--------------------------------------|
| `SITE_URL`               | Base URL for sitemap.xml (e.g. `https://grayrock-80ac05c6df7e.herokuapp.com`) |
| `SALESFORCE_SDK_CDN_URL` | CDN URL: `https://cdn.c360a.salesforce.com/beacon/c360a/75a89832-fee6-4979-b0e4-738ab6ed2fa3/scripts/c360a.min.js` |
| `SALESFORCE_DATASPACE`   | Data space name (default: `default`) |
| `SALESFORCE_TENANT`      | Tenant: `g0ygcmtbh13tszrqgqzwk9l0mm.c360a.salesforce.com` |
| `SALESFORCE_APP_SOURCE`  | App Source ID: `75a89832-fee6-4979-b0e4-738ab6ed2fa3` |

---

## Implementation Checklist

### Admin/Architect

- [x] Create or confirm data space
- [x] Create website connector in Data Cloud
- [x] Map connector object fields
- [x] Create website data stream
- [x] Upload event schema (recommended or custom)
- [x] Create/upload sitemap
- [x] Share CDN URL and data space with developer

### Developer

- [x] Add SDK script to all pages
- [x] Add consent popup; send consent to Data Cloud
- [x] Call `Personalization.Config.initialize()` before `init()`
- [x] Call `SalesforceInteractions.init()` with dataspace and consents
- [x] Configure sitemap with page types and content zones
- [x] Implement `Personalization.fetch()` for personalization points
- [x] Add identity tracking on login
- [x] Add SPA reinit logic if needed
- [x] Test with Personalization and Data Cloud validation tools

---

## References

- [Salesforce Personalization Overview](https://developer.salesforce.com/docs/marketing/einstein-personalization/guide/overview.html)
- [Integrate the Salesforce Interactions SDK](https://developer.salesforce.com/docs/marketing/einstein-personalization/guide/integrate-salesforce-interactions-sdk.html)
- [Personalize Web Experiences with the Salesforce Interactions SDK](https://developer.salesforce.com/docs/marketing/einstein-personalization/guide/personalize-web-experiences.html)
- [Initialize the Personalization Module](https://developer.salesforce.com/docs/marketing/einstein-personalization/guide/initialize-einstein-personalization-module.html)
- [Request Personalization Through the Sitemap](https://developer.salesforce.com/docs/marketing/einstein-personalization/guide/request-personalization-through-sitemap.html)
- [Set Up Content Zones](https://developer.salesforce.com/docs/marketing/einstein-personalization/guide/set-up-content-zones.html)
- [Example Sitemap](https://developer.salesforce.com/docs/marketing/einstein-personalization/guide/example-sitemap.html)
- [Recommended Web Connector Schema (JSON)](https://cdn.c360a.salesforce.com/cdp/schemas/250/web-connector-schema.json)
