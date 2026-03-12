const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

// Session (use memory store; for production consider redis)
app.use(session({
  secret: process.env.SESSION_SECRET || 'r0website-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize DB (JawsDB/ClearDB). API works without DB but returns 503.
let dbReady = false;

// API: Auth
app.post('/api/login', async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const users = require('./db/users');
    const user = await users.findByEmail(email);
    if (!user || !(await users.verifyPassword(user, password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.name;
    res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.post('/api/register', async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const { email, password, firstName, lastName, name, phone, optInEmail, optInSms } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const users = require('./db/users');
    const existing = await users.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || name || null;
    const userId = await users.createUser(email, password, { firstName, lastName, name, phone, optInEmail, optInSms });
    req.session.userId = userId;
    req.session.userEmail = email;
    req.session.userName = displayName;
    res.json({ ok: true, user: { id: userId, email, name: displayName } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.get('/api/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  try {
    const users = require('./db/users');
    const user = await users.getById(req.session.userId);
    if (!user) {
      return res.json({
        id: req.session.userId,
        email: req.session.userEmail,
        name: req.session.userName
      });
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.first_name || null,
      lastName: user.last_name || null,
      phone: user.phone || null,
      optInEmail: !!user.opt_in_email,
      optInSms: !!user.opt_in_sms
    });
  } catch (err) {
    res.json({
      id: req.session.userId,
      email: req.session.userEmail,
      name: req.session.userName
    });
  }
});

// API: Orders
app.post('/api/orders', async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not available' });
  }
  const { items, total } = req.body || {};
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items required' });
  }
  try {
    const orders = require('./db/orders');
    const userId = req.session.userId || null;
    const orderId = await orders.createOrder(userId, items, total || 0);
    res.json({ ok: true, orderId });
  } catch (err) {
    res.status(500).json({ error: 'Order failed' });
  }
});

app.get('/api/orders', async (req, res) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database not available' });
  }
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  try {
    const orders = require('./db/orders');
    const list = await orders.getOrdersByUserId(req.session.userId);
    res.json({ orders: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// API: Products
app.get('/api/products', async (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not available' });
  try {
    const products = require('./db/products');
    const list = await products.getAll();
    res.json({ products: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not available' });
  try {
    const products = require('./db/products');
    const product = await products.getById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.get('/api/products-recommended', async (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not available' });
  try {
    const products = require('./db/products');
    const list = await products.getRecommended();
    res.json({ products: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// API: Content (learn page)
app.get('/api/content', async (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not available' });
  try {
    const content = require('./db/content');
    const list = await content.getAll();
    res.json({ content: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Page routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});
app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'account.html'));
});
app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});
app.get('/learn', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'learn.html'));
});
app.get('/connect', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'connect.html'));
});
app.get('/product', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});
app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});
app.get('/order-confirmation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order-confirmation.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const SITE_URL = process.env.SITE_URL || 'https://r0website.herokuapp.com';
const SITEMAP_PAGES = [
  '',
  '/index.html',
  '/shop.html',
  '/learn.html',
  '/connect.html',
  '/signin.html',
  '/product.html',
  '/checkout.html',
  '/order-confirmation.html',
  '/account.html'
];

app.get('/sitemap.xml', (req, res) => {
  const base = SITE_URL.replace(/\/$/, '');
  const now = new Date().toISOString().split('T')[0];
  const urls = SITEMAP_PAGES.map(p => {
    const loc = p ? base + p : base + '/';
    return `  <url><loc>${loc}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>${p === '' || p === '/index.html' ? '1.0' : '0.8'}</priority></url>`;
  }).join('\n');
  res.type('application/xml').send(
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>'
  );
});

// Admin API (password: Grayrock2026, override via ADMIN_PASSWORD env)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Grayrock2026';

function requireAdmin(req, res, next) {
  if (!req.session.admin) {
    return res.status(401).json({ error: 'Admin access required' });
  }
  next();
}

app.post('/api/admin/auth', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    req.session.admin = true;
    req.session.save((err) => {
      if (err) return res.status(500).json({ error: 'Session error' });
      res.json({ ok: true });
    });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not available' });
  try {
    const users = require('./db/users');
    const list = await users.getAll();
    res.json({ users: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/users/:id/orders', requireAdmin, async (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not available' });
  try {
    const orders = require('./db/orders');
    const userId = parseInt(req.params.id, 10);
    if (!userId) return res.status(400).json({ error: 'Invalid user id' });
    const list = await orders.getOrdersByUserId(userId);
    res.json({ orders: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not available' });
  try {
    const users = require('./db/users');
    const { query } = require('./db/connection');
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Invalid user id' });
    await query('DELETE FROM orders WHERE user_id = ?', [id]);
    const ok = await users.deleteById(id);
    res.json({ ok: !!ok });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.post('/api/admin/clear-all', requireAdmin, async (req, res) => {
  if (!dbReady) return res.status(503).json({ error: 'Database not available' });
  try {
    const orders = require('./db/orders');
    await orders.clearAll();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

(async () => {
  try {
    const db = require('./db/connection');
    if (db.initSchema) await db.initSchema();
    dbReady = true;
  } catch (err) {
    console.warn('[Gray Rock] DB init skipped:', err.message);
  }
  app.listen(PORT, () => {
    console.log(`Gray Rock server running on port ${PORT}`);
  });
})();
