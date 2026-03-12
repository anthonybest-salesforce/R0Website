# Gray Rock – App Summary for Salesforce Marketing Cloud SE

Everything a Salesforce Marketing Cloud Solutions Engineer needs to clone this app.

---

## 1. App Overview

| Field | Value |
|-------|-------|
| **Name** | Gray Rock |
| **Tagline** | "The Neutral Standard." — A stable, unwavering foundation for data and strategy. |
| **Purpose** | E-commerce demo site for curated products (essentials, collectibles, premium). Used as a reference implementation for Salesforce Personalization and Data 360. |
| **Tech Stack** | Node.js 18+, Express 4.x, MySQL (JawsDB/ClearDB), vanilla JS (no framework) |
| **Deployment** | Heroku |

---

## 2. Architecture

```
Gray Rock/
├── server.js              # Express app, API routes, session, static files
├── Procfile               # web: node server.js
├── package.json
├── brandguidelines.md     # Gray Rock brand: logos, colors, typography, voice
├── db/
│   ├── connection.js      # MySQL pool, initSchema, seed data
│   ├── users.js           # Auth, user CRUD
│   ├── orders.js          # Order CRUD
│   ├── products.js       # Product catalog
│   └── content.js        # Learn page content
├── public/
│   ├── *.html             # Static HTML pages
│   ├── css/styles.css     # Brand theme (Gray Rock colors, Inter Tight, Roboto Mono)
│   ├── js/                # Client-side scripts
│   ├── images/
│   │   ├── logo.png       # BlueGray logo (light backgrounds)
│   │   ├── logo-white.png # White logo (dark backgrounds)
│   │   ├── logo-block.png # Block lockup (dark blue-gray)
│   │   ├── hero-1.png … hero-4.png
│   │   └── logo.svg       # Legacy SVG (deprecated; use logo.png)
│   ├── web-connector-schema.json   # Data Cloud event schema
│   ├── salesforce-sitemap.js       # Personalization sitemap
│   └── salesforce-sitemap.json
└── docs/
    └── SALESFORCE-INTEGRATION.md   # Detailed Salesforce setup guide
```

- **Server**: Express with `express-session` (memory store; use Redis in production)
- **Database**: MySQL via `mysql2`; uses `JAWSDB_URL` or `CLEARDB_DATABASE_URL`
- **Auth**: Session-based; `req.session.userId` after login
- **Cart**: Client-side only; stored in `localStorage` (`orgGrayRockCart`)

---

## 3. Branding (Gray Rock)

See **brandguidelines.md** for full details.

| Element | Value |
|---------|-------|
| **Tagline** | "The Neutral Standard." |
| **Logo (primary)** | `public/images/logo.png` — BlueGray, for light backgrounds |
| **Logo (white)** | `public/images/logo-white.png` — For dark backgrounds |
| **Logo (block)** | `public/images/logo-block.png` — Full lockup on dark blue-gray |
| **Colors** | Obsidian #353946, Slate #344558, Basalt #235476, Shale #617ea3, Pebble #afc5de |
| **Typography** | Inter Tight (headlines), Roboto Mono (body) |
| **Voice** | Neutral, factual; no superlatives |

---

## 4. Pages & Routes

| Path | File | Purpose |
|------|------|---------|
| `/` | index.html | Home, hero, product/content recommendations |
| `/signin` | signin.html | Sign in / Create account (toggle) |
| `/signup` | signup.html | Sign up (redirects to signin) |
| `/account` | account.html | My account, order history (requires login) |
| `/shop` | shop.html | Product catalog |
| `/product` | product.html | Product detail (id via `?id=`) |
| `/learn` | learn.html | Content articles |
| `/connect` | connect.html | Web-to-lead form |
| `/checkout` | checkout.html | Cart checkout |
| `/order-confirmation` | order-confirmation.html | Post-purchase |
| `/admin` | admin.html | Admin panel (password-protected) |
| `/sitemap.xml` | Generated | XML sitemap for Data Cloud |

---

## 5. Database Schema

### Tables

**users**
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | bcrypt |
| name | VARCHAR(255) | Display name |
| first_name, last_name | VARCHAR(255) | |
| phone | VARCHAR(50) | |
| opt_in_email, opt_in_sms | TINYINT(1) | 0/1 |
| created_at | TIMESTAMP | |

**orders**
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| user_id | INT | FK → users(id), nullable for guest |
| total | DECIMAL(10,2) | |
| created_at | TIMESTAMP | |

**order_items**
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| order_id | INT FK | → orders(id) |
| product_id | VARCHAR(100) | |
| product_name | VARCHAR(255) | |
| price | DECIMAL(10,2) | |
| qty | INT | |

**products**
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(100) PK | e.g. river-pebbles |
| name | VARCHAR(255) | |
| description | TEXT | |
| price | DECIMAL(10,2) | |
| category | VARCHAR(100) | earth-garden (Home & Garden), collectibles, space (Premium) |
| image_class | VARCHAR(100) | CSS class for image |
| sort_order | INT | |
| created_at | TIMESTAMP | |

**content**
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| title | VARCHAR(500) | |
| meta | VARCHAR(255) | e.g. "Best Practices · 8 min read" |
| body | TEXT | |
| image_class | VARCHAR(100) | |
| sort_order | INT | |
| created_at | TIMESTAMP | |

Schema and seed data are in `db/connection.js` (`initSchema`, `DEFAULT_PRODUCTS`, `DEFAULT_CONTENT`).

---

## 6. API Endpoints

### Auth
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | /api/login | `{ email, password }` | `{ ok, user }` or 401 |
| POST | /api/logout | - | `{ ok }` |
| POST | /api/register | `{ email, password, firstName, lastName, name, phone, optInEmail, optInSms }` | `{ ok, user }` or 409 |
| GET | /api/me | - | `{ id, email, name, firstName, lastName, phone, optInEmail, optInSms }` (401 if not logged in) |

### Orders
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | /api/orders | `{ items: [{ id, name, price, qty }], total }` | `{ ok, orderId }` |
| GET | /api/orders | - | `{ orders }` (requires login) |

### Products
| Method | Path | Response |
|--------|------|----------|
| GET | /api/products | `{ products }` |
| GET | /api/products/:id | Product object |
| GET | /api/products-recommended | `{ products }` |

### Content
| Method | Path | Response |
|--------|------|----------|
| GET | /api/content | `{ content }` |

### Admin (requires `req.session.admin`)
| Method | Path | Notes |
|--------|------|-------|
| POST | /api/admin/auth | `{ password }` – sets session.admin |
| GET | /api/admin/users | List users |
| GET | /api/admin/users/:id/orders | User orders |
| DELETE | /api/admin/users/:id | Delete user + orders |
| POST | /api/admin/clear-all | Delete all orders |

---

## 7. Salesforce Integration

### Overview
- **Salesforce Personalization** and **Data 360** via **Salesforce Interactions SDK**
- CDN script loads SDK; consent popup gates initialization
- Events sent to Data Cloud; identity set on login/account load

### Script Load Order (every page)
```html
<script src="https://cdn.c360a.salesforce.com/beacon/c360a/75a89832-fee6-4979-b0e4-738ab6ed2fa3/scripts/c360a.min.js"></script>
<script src="js/consent.js"></script>
<script src="js/console.js"></script>
<script src="js/salesforce-init.js"></script>
<script src="js/auth.js"></script>
<script src="js/cart.js"></script>
```

### Tenant Configuration (embedded in CDN)
| Setting | Value |
|---------|-------|
| Tenant | `g0ygcmtbh13tszrqgqzwk9l0mm.c360a.salesforce.com` |
| App Source ID | `75a89832-fee6-4979-b0e4-738ab6ed2fa3` |
| Data space | `default` |

### Consent Flow
- **consent.js**: First visit shows modal (Accept/Reject)
- Stored in `localStorage` as `orgGrayRockConsent` (`accepted` / `rejected`)
- Dispatches `orgGrayRockConsentReady` with status
- **salesforce-init.js** listens and calls `SI.init()` with `ConsentStatus.OptIn` or `OptOut`
- Cookie preferences link calls `window.orgGrayRockShowConsentPopup()`; `updateConsents()` updates Data Cloud

### Custom Events (Data Cloud)

| Event | eventType | When | File |
|-------|-----------|------|------|
| signIn | signIn | User logs in | signin.html |
| createAccount | createAccount | User registers | signin.html |
| accountView | userEngagement | Account page load (logged in) | account.js |
| webToLead | webToLead | Connect form submit | connect.js |
| Add To Cart | (CartInteractionName) | Add to cart | cart.js |
| Replace Cart | (CartInteractionName) | Cart updated | cart.js |
| Purchase | (OrderInteractionName) | Checkout complete | checkout.js |
| userEngagement | userEngagement | Page views (sitemap) | salesforce-init.js |

### Identity
- `SI.setIdentity({ identifiers: [{ type: 'email', value }] })` on:
  - Sign in (signin.html)
  - Create account (signin.html)
  - Account page load (account.js)

### Content Zones (Sitemap)
| Page | Zones |
|------|-------|
| home | hero_banner, product_recommendations, content_recommendations |
| shop | shop_grid |
| product | product_detail |
| learn | learn_articles, learn_recommended |
| account | order_recommendations |

### Key Files
| File | Role |
|------|------|
| public/js/salesforce-init.js | SDK init, Personalization.Config.initialize, sitemap, sendEvent wrapper, Personalization.fetch |
| public/js/consent.js | Consent modal, localStorage, orgGrayRockConsentReady |
| public/js/connect.js | webToLead sendEvent on form submit |
| public/js/account.js | setIdentity, accountView sendEvent |
| public/signin.html (inline) | signIn, createAccount sendEvent |
| public/js/cart.js | AddToCart, ReplaceCart sendEvent |
| public/js/checkout.js | Purchase sendEvent |
| public/web-connector-schema.json | Data Cloud event schema (upload to connector) |
| public/salesforce-sitemap.js | Sitemap config (upload to Data Cloud) |

### Web Connector Schema
- Location: `public/web-connector-schema.json`
- Includes: cart, cartItem, catalog, order, orderItem, consentLog, identity, contactPointEmail, contactPointPhone, partyIdentification, **userEngagement**, **signIn**, **createAccount**, **webToLead**
- Upload in Data Cloud Setup → Websites & Mobile Apps → your connector → Upload Schema

---

## 8. Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 3001 (default) |
| NODE_ENV | production / development | production |
| SESSION_SECRET | Session signing secret | Change in production |
| JAWSDB_URL | MySQL connection URL (Heroku) | mysql://... |
| CLEARDB_DATABASE_URL | Alternative MySQL URL | mysql://... |
| SITE_URL | Base URL for sitemap.xml | https://grayrock-80ac05c6df7e.herokuapp.com |
| ADMIN_PASSWORD | Admin panel password | Grayrock2026 (default) |
| SALESFORCE_SDK_CDN_URL | SDK script URL | (see docs) |
| SALESFORCE_DATASPACE | Data space name | default |
| SALESFORCE_TENANT | Tenant host | g0ygcmtbh13tszrqgqzwk9l0mm.c360a.salesforce.com |
| SALESFORCE_APP_SOURCE | App Source ID | 75a89832-fee6-4979-b0e4-738ab6ed2fa3 |

---

## 9. Deployment

### Heroku
- **Procfile**: `web: node server.js`
- **Buildpack**: Node.js (auto-detected)
- **Database**: Add JawsDB MySQL or ClearDB add-on
- **Config vars**: Set `JAWSDB_URL` or `CLEARDB_DATABASE_URL`, `SESSION_SECRET`, `SITE_URL`, `ADMIN_PASSWORD`

### Commands
```bash
npm install
npm start
# Or: node server.js
```

### Deploy
```bash
git push heroku main
```

---

## 10. File Inventory

| Path | Role |
|------|------|
| brandguidelines.md | Gray Rock brand: logos, colors, typography, voice |
| server.js | Express server, API, routes, sitemap.xml |
| db/connection.js | MySQL pool, schema, seeds |
| db/users.js | User CRUD, bcrypt |
| db/orders.js | Order CRUD |
| db/products.js | Product catalog |
| db/content.js | Learn content |
| public/index.html | Home |
| public/signin.html | Sign in / Create account |
| public/signup.html | Sign up redirect |
| public/account.html | Account + orders |
| public/shop.html | Product list |
| public/product.html | Product detail |
| public/learn.html | Content articles |
| public/connect.html | Web-to-lead form |
| public/checkout.html | Checkout |
| public/order-confirmation.html | Order confirmation |
| public/admin.html | Admin panel |
| public/css/styles.css | Styles (Gray Rock brand theme) |
| public/images/logo.png | BlueGray logo (primary) |
| public/images/logo-white.png | White logo (dark backgrounds) |
| public/images/logo-block.png | Block lockup logo |
| public/js/consent.js | Consent popup |
| public/js/console.js | Event console (dev) |
| public/js/salesforce-init.js | SDK init, sitemap |
| public/js/auth.js | Nav auth state |
| public/js/cart.js | Cart + AddToCart/ReplaceCart |
| public/js/checkout.js | Checkout + Purchase |
| public/js/account.js | Account page + identity |
| public/js/connect.js | webToLead |
| public/web-connector-schema.json | Data Cloud schema |
| public/salesforce-sitemap.js | Sitemap config |
| docs/SALESFORCE-INTEGRATION.md | Full Salesforce guide |

---

## 11. Cloning Checklist for SE

### 1. Repo & Dependencies
- [ ] Clone repo
- [ ] `npm install`
- [ ] Verify Node 18+

### 2. Database
- [ ] Provision MySQL (JawsDB, ClearDB, or local)
- [ ] Set `JAWSDB_URL` or `CLEARDB_DATABASE_URL`
- [ ] Run app once to auto-init schema and seeds

### 3. Environment
- [ ] Set `SESSION_SECRET`
- [ ] Set `SITE_URL` to production URL
- [ ] Set `ADMIN_PASSWORD` (optional)

### 4. Data Cloud Setup (Admin/Architect)
- [ ] Create data space (or use default)
- [ ] Create Website connector in Data Cloud
- [ ] Map connector object fields
- [ ] Create website data stream
- [ ] Upload `public/web-connector-schema.json` (or add signIn, createAccount, webToLead if using standard schema)
- [ ] Upload `public/salesforce-sitemap.js` or `public/salesforce-sitemap.json` to connector
- [ ] Note CDN URL from connector

### 5. Branding (optional)
- [ ] Review `brandguidelines.md` for logo usage, colors, typography
- [ ] Ensure `public/images/logo.png`, `logo-white.png`, `logo-block.png` are present

### 6. Website Scripts
- [ ] Replace CDN script URL in HTML if using new connector (or keep existing)
- [ ] Ensure script order: CDN → consent.js → console.js → salesforce-init.js → auth.js → cart.js
- [ ] Verify consent popup and Cookie preferences work

### 7. Deploy
- [ ] Deploy to Heroku (or other host)
- [ ] Set config vars
- [ ] Verify `/sitemap.xml` returns correct URLs
- [ ] Test sign in, create account, web-to-lead, cart, checkout
- [ ] Confirm events in Data Cloud / Personalization

### 8. Validation
- [ ] Use Data Cloud validation tools
- [ ] Use Personalization validation tools
- [ ] Check Event Console (Console button) for event flow

---

## References

- [brandguidelines.md](brandguidelines.md) – Gray Rock brand guidelines
- [docs/SALESFORCE-INTEGRATION.md](docs/SALESFORCE-INTEGRATION.md) – Full Salesforce setup and API details
- [Salesforce Personalization Overview](https://developer.salesforce.com/docs/marketing/einstein-personalization/guide/overview.html)
- [Integrate the Salesforce Interactions SDK](https://developer.salesforce.com/docs/marketing/einstein-personalization/guide/integrate-salesforce-interactions-sdk.html)
