# R0Website – Setup Guide (GitHub + Heroku)

This guide walks you through setting up a **new** GitHub repository and **new** Heroku application for R0Website. Follow the steps in order.

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- [Git](https://git-scm.com/) installed
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed and logged in (`heroku login`)
- A GitHub account

---

## Step 1: Verify the Project Locally

Before creating any remotes, confirm the site runs:

```bash
cd /Users/abest/Cursor/R0Website
npm install
npm start
```

Visit **http://localhost:3001**. If it loads, you’re ready to proceed.

---

## Step 2: Create the GitHub Repository

**When:** Do this **before** your first commit, so you can push to GitHub right away.

1. On GitHub, create a **new repository**:
   - Name: **R0Website** (or `R0Webiste` if that’s your preferred spelling)
   - Visibility: Public or Private
   - **Do not** initialize with a README, .gitignore, or license (the project already has these)

2. Copy the repository URL (e.g. `https://github.com/YOUR_USERNAME/R0Website.git`).

---

## Step 3: Initialize Git and Push to GitHub

**When:** Right after creating the GitHub repo.

```bash
cd /Users/abest/Cursor/R0Website

# Initialize a new Git repository (no .git from backup)
git init

# Stage all files
git add -A

# First commit
git commit -m "Initial commit - R0Website from backup"

# Add GitHub as origin (replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/R0Website.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 4: Create the Heroku Application

**When:** Do this **after** your first push to GitHub, so you can deploy immediately.

1. Create a new Heroku app named **R0Website**:

   ```bash
   heroku create r0website
   ```

   This creates the app and adds the `heroku` remote.

2. Add a MySQL database (JawsDB free tier):

   ```bash
   heroku addons:create jawsdb:kitefin --app r0website
   ```

3. Set config vars:

   ```bash
   heroku config:set SESSION_SECRET=$(openssl rand -hex 32) --app r0website
   heroku config:set SITE_URL=https://r0website.herokuapp.com --app r0website
   heroku config:set ADMIN_PASSWORD=YourSecureAdminPassword --app r0website
   ```

   Replace `YourSecureAdminPassword` with a strong password for the admin panel.

---

## Step 5: Deploy to Heroku

**When:** After the Heroku app and add-ons are configured.

```bash
git push heroku main
```

Heroku will build and deploy. When it finishes, open:

**https://r0website.herokuapp.com**

---

## Summary: Order of Operations

| Step | Action |
|------|--------|
| 1 | Verify project runs locally (`npm install` + `npm start`) |
| 2 | Create **GitHub** repo (R0Website) on github.com |
| 3 | `git init` → `git add -A` → `git commit` → `git remote add origin` → `git push origin main` |
| 4 | Create **Heroku** app: `heroku create r0website` |
| 5 | Add JawsDB: `heroku addons:create jawsdb:kitefin --app r0website` |
| 6 | Set config vars (SESSION_SECRET, SITE_URL, ADMIN_PASSWORD) |
| 7 | Deploy: `git push heroku main` |

---

## Quick Reference

| Resource | Value |
|----------|-------|
| GitHub repo | `https://github.com/YOUR_USERNAME/R0Website` |
| Heroku app | `r0website` |
| Heroku URL | `https://r0website.herokuapp.com` |
| Admin panel | `https://r0website.herokuapp.com/admin` |

---

## Troubleshooting

- **Heroku app name taken:** If `r0website` is taken, use `heroku create r0website-alt` (or similar) and update `SITE_URL` accordingly.
- **Database errors:** Ensure JawsDB is added and `JAWSDB_URL` is set (Heroku sets this automatically).
- **Deploy fails:** Run `heroku logs --tail --app r0website` to inspect errors.
