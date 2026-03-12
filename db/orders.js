const { query } = require('./connection');

async function createOrder(userId, items, total) {
  const result = await query(
    'INSERT INTO orders (user_id, total) VALUES (?, ?)',
    [userId || null, total]
  );
  const orderId = result && result.insertId ? result.insertId : null;
  if (!orderId) return null;

  for (const item of items) {
    await query(
      'INSERT INTO order_items (order_id, product_id, product_name, price, qty) VALUES (?, ?, ?, ?, ?)',
      [orderId, item.id, item.name, item.price, item.qty || 1]
    );
  }
  return orderId;
}

async function getOrdersByUserId(userId) {
  const orders = await query(
    'SELECT id, total, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  if (!orders || !orders.length) return [];

  const result = [];
  for (const order of orders) {
    const items = await query(
      'SELECT product_id, product_name, price, qty FROM order_items WHERE order_id = ?',
      [order.id]
    );
    result.push({
      id: order.id,
      total: parseFloat(order.total),
      created_at: order.created_at,
      items: items || []
    });
  }
  return result;
}

async function getOrderById(orderId) {
  const rows = await query('SELECT * FROM orders WHERE id = ?', [orderId]);
  const order = rows && rows[0];
  if (!order) return null;
  const items = await query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
  return { ...order, items: items || [] };
}

async function clearAll() {
  const { query } = require('./connection');
  await query('DELETE FROM order_items');
  await query('DELETE FROM orders');
  await query('DELETE FROM users');
}

module.exports = { createOrder, getOrdersByUserId, getOrderById, clearAll };
