# Gray Rock Website

**Gray Rock** is a premium e-commerce website showcasing curated products—essentials, collectibles, and exclusive items—with a modern, trustworthy aesthetic. Built as a reference implementation for **Salesforce Personalization** and **Salesforce Data 360**, it demonstrates end-to-end customer engagement tracking, identity resolution, and personalized experiences across the Customer 360 platform.

---

## Project Overview

### Purpose

Gray Rock serves as both a **functional e-commerce demo** and a **Salesforce integration showcase**. It provides:

- **For customers:** A polished shopping experience with product browsing, account management, checkout, and lead capture
- **For Salesforce practitioners:** A working example of how to instrument a website with the Salesforce Interactions SDK, send events to Data Cloud, and power personalization
- **For Solutions Engineers:** A cloneable reference app for demos, POCs, and customer implementations

### Key Features

| Feature | Description |
|---------|-------------|
| **Product catalog** | Shop page with product categories (Home & Garden, Collectibles, Premium) |
| **User accounts** | Sign up, sign in, account profile with order history |
| **Shopping cart** | Client-side cart with checkout and order confirmation |
| **Learn** | Content hub with articles and recommendations |
| **Connect** | Web-to-lead form for sales inquiries |
| **Admin panel** | Password-protected user and order management |
| **Salesforce integration** | Consent management, identity tracking, event streaming to Data Cloud, personalization-ready content zones |

### Tech Stack

- **Backend:** Node.js 18+, Express 4.x
- **Database:** MySQL (JawsDB / ClearDB on Heroku)
- **Frontend:** Vanilla HTML/CSS/JavaScript (no framework)
- **Auth:** Session-based (express-session), bcrypt for passwords
- **Deployment:** Heroku

---

## Architecture

```
Gray Rock/
├── server.js              # Express app, API routes, session, static files
├── Procfile               # Heroku: web: node server.js
├── package.json
├── db/
│   ├── connection.js      # MySQL pool, schema init, seed data
│   ├── users.js           # User auth and CRUD
│   ├── orders.js          # Order creation and history
│   ├── products.js        # Product catalog
│   └── content.js         # Learn page content
├── public/
│   ├── *.html             # All page templates
│   ├── css/styles.css     # Styling (Salesforce SLDS-inspired)
│   ├── js/                # Client scripts (auth, cart, consent, Salesforce SDK init)
│   ├── images/
│   ├── web-connector-schema.json   # Data Cloud event schema
│   └── salesforce-sitemap.js       # Personalization sitemap config
└── docs/
    ├── SALESFORCE-INTEGRATION.md   # Full Salesforce setup guide
    └── DATABASE-SETUP.md           # MySQL setup for Heroku
```

- **Cart:** Stored in `localStorage` (`orgGrayRockCart`); no server-side cart
- **Session:** Memory store (consider Redis for production scale)

---

## Pages & User Flows

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Home | Hero, product recommendations, content recommendations |
| `/shop` | Shop | Product catalog by category |
| `/product?id=` | Product detail | Single product view, add to cart |
| `/learn` | Learn | Content articles and recommendations |
| `/connect` | Connect | Web-to-lead form (company, phone, message) |
| `/signin` | Sign In | Login and create-account toggle |
| `/signup` | Sign Up | Redirects to signin |
| `/account` | Account | Profile, order history (requires login) |
| `/checkout` | Checkout | Cart review and place order |
| `/order-confirmation` | Order confirmation | Post-purchase confirmation |
| `/admin` | Admin | User list, order management (password-protected) |
| `/sitemap.xml` | Sitemap | Generated XML for Data Cloud / SEO |

---

## Salesforce Integration

Gray Rock is instrumented for **Salesforce Personalization** and **Data 360** via the **Salesforce Interactions SDK**.

### What It Does

1. **Consent management** – First-visit popup (Accept/Reject); cookie preferences link in footer
2. **Identity tracking** – `setIdentity` with email on sign-in, account creation, and account page load
3. **Event streaming** – Page views, sign-in, create-account, web-to-lead, add-to-cart, checkout, and order events sent to Data Cloud
4. **Personalization readiness** – Sitemap defines page types and content zones (hero, recommendations, etc.) for Web Personalization Manager

### Custom Events

| Event | When |
|-------|------|
| `signIn` | User logs in |
| `createAccount` | User registers |
| `accountView` | Logged-in user loads account page |
| `webToLead` | Connect form submitted |
| Cart / Order events | Add to cart, checkout, purchase |

### Key Files

- `public/js/salesforce-init.js` – SDK init, sitemap, personalization config
- `public/js/consent.js` – Consent modal and Data Cloud consent updates
- `public/js/connect.js` – Web-to-lead `sendEvent`
- `public/web-connector-schema.json` – Event schema for Data Cloud connector
- `public/salesforce-sitemap.js` – Sitemap for Personalization

**Full setup:** See [docs/SALESFORCE-INTEGRATION.md](docs/SALESFORCE-INTEGRATION.md).

---

## Local Development

```bash
npm install
npm start
```

Visit **http://localhost:3001**

### Environment Variables (Optional)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `SESSION_SECRET` | Session signing secret |
| `JAWSDB_URL` or `CLEARDB_DATABASE_URL` | MySQL connection URL |
| `SITE_URL` | Base URL for sitemap.xml |
| `ADMIN_PASSWORD` | Admin panel password (default: Grayrock2026) |

Without a database, the site runs but sign-in/sign-up and product data will fail; checkout still works with session storage.

---

## Deployment

### Heroku

1. Create app and add MySQL add-on (JawsDB or ClearDB):

   ```bash
   heroku create your-app-name
   heroku addons:create jawsdb:kitefin --app your-app-name
   ```

2. Set config vars:

   ```bash
   heroku config:set SESSION_SECRET=your-secret
   heroku config:set SITE_URL=https://your-app-name.herokuapp.com
   heroku config:set ADMIN_PASSWORD=your-admin-password
   ```

3. Deploy:

   ```bash
   git push heroku main
   ```

### GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-org/grayrockwebsite.git
git push -u origin main
```

---

## Additional Documentation

| Document | Purpose |
|----------|---------|
| [docs/SALESFORCE-INTEGRATION.md](docs/SALESFORCE-INTEGRATION.md) | Salesforce Personalization & Data 360 setup, schema, sitemap |
| [docs/DATABASE-SETUP.md](docs/DATABASE-SETUP.md) | MySQL setup for Heroku |
| [summary.md](summary.md) | App summary for Salesforce Marketing Cloud SE (cloning checklist) |

---

## License & Credits

Gray Rock is a demo/reference application. The design uses Salesforce SLDS-inspired colors and patterns for a cohesive, enterprise-ready look.
