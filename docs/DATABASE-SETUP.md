# MySQL Database Setup (Heroku)

Gray Rock uses MySQL for users and order history. Add a MySQL add-on to your Heroku app.

## Add JawsDB (Free Tier)

```bash
heroku addons:create jawsdb:kitefin --app r0website
```

Or use ClearDB:

```bash
heroku addons:create cleardb:ignite --app r0website
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `JAWSDB_URL` | Set automatically by JawsDB add-on |
| `CLEARDB_DATABASE_URL` | Set automatically by ClearDB add-on |
| `SESSION_SECRET` | Optional; set for production: `heroku config:set SESSION_SECRET=your-secret` |

## Schema

The app auto-creates tables on first run:

- **users** – id, email, password_hash, name, created_at
- **orders** – id, user_id, total, created_at
- **order_items** – id, order_id, product_id, product_name, price, qty

## Features

- **Sign up** – Create account at `/signup`
- **Sign in** – Log in at `/signin`
- **Order history** – Orders saved to DB when user is logged in; view at `/account`
- **Guest checkout** – Orders without login still work (saved to sessionStorage only)

## Without Database

The site works without a database. Sign in/sign up will show an error. Checkout and order confirmation still work using sessionStorage.
