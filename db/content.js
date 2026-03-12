const { query } = require('./connection');

async function getAll() {
  const rows = await query('SELECT id, title, meta, body, image_class FROM content ORDER BY sort_order ASC, id ASC');
  return rows || [];
}

module.exports = { getAll };
