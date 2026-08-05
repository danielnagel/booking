import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Nicht angemeldet.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Session ungueltig oder abgelaufen.' });
  }

  // A JWT stays valid for its full lifetime (12h) regardless of what happens
  // to the account it was issued for, so a deleted user could otherwise keep
  // using a still-valid cookie until it expires.
  const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [payload.sub]);
  if (rows.length === 0) {
    return res.status(401).json({ error: 'Session ungueltig oder abgelaufen.' });
  }

  req.user = { id: payload.sub, username: payload.username };
  return next();
}
