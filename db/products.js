const { query } = require('./connection');

async function getAll() {
  const rows = await query('SELECT id, name, description, price, category, image_class FROM products ORDER BY sort_order ASC, id ASC');
  return rows || [];
}

async function getById(id) {
  const rows = await query('SELECT id, name, description, price, category, image_class FROM products WHERE id = ?', [id]);
  return rows && rows[0] || null;
}

async function getRecommended(limit = 3) {
  const ids = ['river-pebbles', 'meteorite-fragment', 'moon-rock-collection'];
  const placeholders = ids.map(() => '?').join(',');
  const rows = await query(`SELECT id, name, description, price, category, image_class FROM products WHERE id IN (${placeholders})`, ids);
  return rows || [];
}

module.exports = { getAll, getById, getRecommended };
