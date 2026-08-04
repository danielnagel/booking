import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const BCRYPT_ROUNDS = 10;
const JWT_EXPIRES_IN = '12h';
const COOKIE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

router.post('/register', async (req, res) => {
  const { inviteCode, username, password } = req.body ?? {};

  if (!inviteCode || !username || !password) {
    return res
      .status(400)
      .json({ error: 'inviteCode, username und password sind erforderlich.' });
  }

  const { rows: inviteRows } = await pool.query(
    `SELECT code FROM invite_codes
     WHERE code = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [inviteCode],
  );

  if (inviteRows.length === 0) {
    return res
      .status(400)
      .json({ error: 'Invite-Code ist ungueltig, abgelaufen oder deaktiviert.' });
  }

  const { rows: existingUsers } = await pool.query(
    'SELECT id FROM users WHERE username = $1',
    [username],
  );

  if (existingUsers.length > 0) {
    return res.status(409).json({ error: 'Username ist bereits vergeben.' });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await pool.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
    [username, passwordHash],
  );

  return res.status(201).json({ username });
});

router.post('/reset-password', async (req, res) => {
  const { resetCode, newPassword } = req.body ?? {};

  if (!resetCode || !newPassword) {
    return res
      .status(400)
      .json({ error: 'resetCode und newPassword sind erforderlich.' });
  }

  const { rows } = await pool.query(
    `SELECT code, user_id FROM password_reset_codes
     WHERE code = $1 AND used_at IS NULL AND expires_at > now()`,
    [resetCode],
  );

  if (rows.length === 0) {
    return res
      .status(400)
      .json({ error: 'Reset-Code ist ungueltig, abgelaufen oder bereits verwendet.' });
  }

  const { user_id: userId } = rows[0];
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
    passwordHash,
    userId,
  ]);
  await pool.query(
    'UPDATE password_reset_codes SET used_at = now() WHERE code = $1',
    [resetCode],
  );

  return res.status(200).json({ success: true });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: 'username und password sind erforderlich.' });
  }

  const { rows } = await pool.query(
    'SELECT id, username, password_hash FROM users WHERE username = $1',
    [username],
  );

  if (rows.length === 0) {
    return res.status(401).json({ error: 'Username oder Passwort falsch.' });
  }

  const user = rows[0];
  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    return res.status(401).json({ error: 'Username oder Passwort falsch.' });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE_MS,
  });

  return res.status(200).json({ username: user.username });
});

router.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({ id: req.user.id, username: req.user.username });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });

  return res.status(200).json({ success: true });
});

export default router;
