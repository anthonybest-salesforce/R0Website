const { query } = require('./connection');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

async function createUser(email, password, opts = {}) {
  const { firstName, lastName, name, phone, optInEmail, optInSms } = opts;
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || name || null;
  const result = await query(
    `INSERT INTO users (email, password_hash, name, first_name, last_name, phone, opt_in_email, opt_in_sms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [email, hash, displayName, firstName || null, lastName || null, phone || null, optInEmail ? 1 : 0, optInSms ? 1 : 0]
  );
  return result && result.insertId ? result.insertId : null;
}

async function findByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
  return rows && rows[0] || null;
}

async function verifyPassword(user, password) {
  return user && await bcrypt.compare(password, user.password_hash);
}

async function getById(id) {
  const rows = await query('SELECT id, email, name, first_name, last_name, phone, opt_in_email, opt_in_sms, created_at FROM users WHERE id = ?', [id]);
  return rows && rows[0] || null;
}

async function getAll() {
  const rows = await query(
    'SELECT id, email, name, first_name, last_name, opt_in_email, opt_in_sms, created_at FROM users ORDER BY created_at DESC'
  );
  return rows || [];
}

async function deleteById(id) {
  const result = await query('DELETE FROM users WHERE id = ?', [id]);
  return result && result.affectedRows > 0;
}

module.exports = { createUser, findByEmail, verifyPassword, getById, getAll, deleteById };
