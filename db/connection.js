/**
 * MySQL connection for Gray Rock
 * Uses JAWSDB_URL (JawsDB) or CLEARDB_DATABASE_URL (ClearDB) on Heroku
 */
const mysql = require('mysql2/promise');

let pool = null;

function getPool() {
  if (pool) return pool;
  const url = process.env.JAWSDB_URL || process.env.CLEARDB_DATABASE_URL;
  if (!url) {
    console.warn('[Gray Rock] No MySQL URL (JAWSDB_URL or CLEARDB_DATABASE_URL). Database disabled.');
    return null;
  }
  pool = mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  return pool;
}

async function query(sql, params = []) {
  const p = getPool();
  if (!p) return null;
  try {
    const [result] = await p.execute(sql, params);
    return result;
  } catch (err) {
    console.error('[Gray Rock] DB error:', err.message);
    throw err;
  }
}

async function initSchema() {
  const p = getPool();
  if (!p) return;

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      opt_in_email TINYINT(1) DEFAULT 0,
      opt_in_sms TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Migrate existing tables: add new columns if missing
  const cols = ['first_name', 'last_name', 'phone', 'opt_in_email', 'opt_in_sms'];
  for (const col of cols) {
    try {
      const def = col.startsWith('opt_') ? 'TINYINT(1) DEFAULT 0' : (col === 'phone' ? 'VARCHAR(50)' : 'VARCHAR(255)');
      await query(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
    } catch (e) {
      if (!/Duplicate column/.test(e.message)) throw e;
    }
  }

  /* orders: one row per order; order_items: one row per line item (multiple items per order) */
  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      total DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id VARCHAR(100) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      qty INT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      category VARCHAR(100),
      image_class VARCHAR(100),
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS content (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      meta VARCHAR(255),
      body TEXT,
      image_class VARCHAR(100),
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await seedProducts();
  await seedContent();

  console.log('[Gray Rock] Database schema initialized');
}

const DEFAULT_PRODUCTS = [
  { id: 'river-pebbles', name: 'River Pebbles Collection', description: 'Smooth, naturally tumbled river pebbles from mountain streams. Perfect for landscaping, aquariums, or decorative gardens. Each bag contains 5 lbs of assorted sizes.', price: 8.99, category: 'earth-garden', image_class: 'river-pebbles' },
  { id: 'premium-potting-soil', name: 'Premium Potting Soil', description: 'Organic blend of compost, peat moss, and perlite. Enriched with earthworm castings for optimal plant growth. Ideal for indoor and outdoor container gardening.', price: 24.99, category: 'earth-garden', image_class: 'premium-potting-soil' },
  { id: 'volcanic-pumice', name: 'Volcanic Pumice Stones', description: 'Lightweight volcanic rock from ancient lava flows. Excellent for soil aeration, succulent mixes, and bonsai. Naturally porous and pH-neutral.', price: 45.00, category: 'earth-garden', image_class: 'volcanic-pumice' },
  { id: 'rare-obsidian', name: 'Rare Black Obsidian', description: 'Natural volcanic glass formed from rapidly cooled lava. Museum-quality specimens with glassy luster. Sourced from volcanic regions worldwide.', price: 129.99, category: 'collectibles', image_class: 'rare-obsidian' },
  { id: 'amethyst-geode', name: 'Amethyst Geode', description: 'Stunning purple crystal formation inside a natural rock cavity. Each geode is unique with varying shades of violet. Display piece or metaphysical use.', price: 349.99, category: 'collectibles', image_class: 'amethyst-geode' },
  { id: 'fossilized-limestone', name: 'Fossilized Limestone Block', description: 'Ancient sedimentary rock embedded with fossilized marine life. Millions of years in the making. Perfect for collectors and educational displays.', price: 599.00, category: 'collectibles', image_class: 'fossilized-limestone' },
  { id: 'meteorite-fragment', name: 'Authentic Meteorite Fragment', description: 'Certified premium collectible with distinctive characteristics. Includes certificate of authenticity. A standout addition for serious collectors.', price: 2499.99, category: 'collectibles', image_class: 'meteorite-fragment' },
  { id: 'diamond-kimberlite', name: 'Diamond-Bearing Kimberlite', description: 'Raw kimberlite ore from diamond pipe formations. Contains trace diamond indicators. For serious collectors and geological enthusiasts.', price: 12500.00, category: 'collectibles', image_class: 'diamond-kimberlite' },
  { id: 'lunar-soil-sample', name: 'Lunar Soil Sample', description: 'Authentic certified specimen. Encapsulated and documented. The ultimate premium addition for your collection.', price: 45000.00, category: 'space', image_class: 'lunar-soil-sample' },
  { id: 'martian-regolith', name: 'Martian Regolith Simulant', description: 'Scientifically accurate simulant for research and education. Formulated from advanced analysis. Used by leading institutions.', price: 89999.00, category: 'space', image_class: 'martian-regolith' },
  { id: 'asteroid-mining-rights', name: 'Asteroid Mining Rights Certificate', description: 'Symbolic certificate for a designated premium asset. Includes coordinates and composition data. A conversation piece for forward-thinking collectors.', price: 165000.00, category: 'space', image_class: 'asteroid-mining-rights' },
  { id: 'moon-rock-collection', name: 'Moon Rock Collection', description: 'Curated collection of premium specimens from multiple sources. Museum-grade with full provenance documentation.', price: 182000.00, category: 'space', image_class: 'moon-rock-collection' }
];

const DEFAULT_CONTENT = [
  { title: 'Industry Fundamentals: Core Concepts Every Leader Should Know', meta: 'Best Practices · 8 min read', body: "Every industry is built on fundamental concepts that drive success. Understanding core principles—whether in operations, strategy, or customer engagement—helps you make better decisions. These fundamentals form the foundation that separates thriving businesses from those that struggle to adapt.", image_class: 'rock', sort_order: 1 },
  { title: 'Market Dynamics: How Industries Shift and Evolve', meta: 'Strategy · 10 min read', body: "Markets are constantly in motion. Understanding how industries shift, where opportunities emerge, and how to position your business for change is essential. Competitive dynamics, regulatory shifts, and technological advances reshape landscapes. Leaders who anticipate these movements stay ahead.", image_class: 'geology', sort_order: 2 },
  { title: 'Innovation and Growth: Scaling Your Business Effectively', meta: 'Growth · 12 min read', body: 'Growth requires more than ambition—it demands strategy, execution, and the right systems. Learn how successful organizations scale while maintaining quality and culture. From process optimization to talent development, the path to sustainable growth is built on proven principles.', image_class: 'space', sort_order: 3 }
];

async function seedProducts() {
  const existing = await query('SELECT COUNT(*) as c FROM products');
  if (existing && existing[0] && existing[0].c > 0) return;
  for (let i = 0; i < DEFAULT_PRODUCTS.length; i++) {
    const p = DEFAULT_PRODUCTS[i];
    await query(
      'INSERT INTO products (id, name, description, price, category, image_class, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [p.id, p.name, p.description, p.price, p.category, p.image_class, i]
    );
  }
}

async function seedContent() {
  const existing = await query('SELECT COUNT(*) as c FROM content');
  if (existing && existing[0] && existing[0].c > 0) return;
  for (let i = 0; i < DEFAULT_CONTENT.length; i++) {
    const c = DEFAULT_CONTENT[i];
    await query(
      'INSERT INTO content (title, meta, body, image_class, sort_order) VALUES (?, ?, ?, ?, ?)',
      [c.title, c.meta, c.body, c.image_class, c.sort_order]
    );
  }
}

module.exports = { getPool, query, initSchema };
