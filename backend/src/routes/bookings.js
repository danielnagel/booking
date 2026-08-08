import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const PAGE_SIZE = 50;

const SEARCHABLE_COLUMNS = [
  'event_name',
  'organizer',
  'organizer_website',
  'organizer_email',
  'application_text',
  'venue_street',
  'venue_zip',
  'venue_city',
];

const SORTABLE_COLUMNS = [
  'event_name',
  'event_date',
  'organizer',
  'organizer_website',
  'organizer_email',
  'application_text',
  'venue_street',
  'venue_zip',
  'venue_city',
  'fee',
  'status',
];

const WRITABLE_FIELDS = [
  'event_name',
  'event_date',
  'organizer',
  'organizer_website',
  'organizer_email',
  'application_text',
  'venue_street',
  'venue_zip',
  'venue_city',
  'fee',
  'status',
];

const STATUS_VALUES = ['offen', 'angenommen', 'abgelehnt', 'storniert'];

function normalizeValue(value) {
  return value === undefined || value === '' ? null : value;
}

router.use(requireAuth);

router.get('/', async (req, res) => {
  const { search, sortBy, sortDir } = req.query;

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const sortColumn = SORTABLE_COLUMNS.includes(sortBy) ? sortBy : 'created_at';
  const sortDirection = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const whereClauses = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    const searchPlaceholder = `$${params.length}`;
    whereClauses.push(
      `(${SEARCHABLE_COLUMNS.map((column) => `${column} ILIKE ${searchPlaceholder}`).join(' OR ')})`,
    );
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countResult = await pool.query(
    `SELECT COUNT(*) AS total FROM bookings ${whereSql}`,
    params,
  );
  const total = Number.parseInt(countResult.rows[0].total, 10);

  params.push(PAGE_SIZE);
  const limitPlaceholder = `$${params.length}`;
  params.push(offset);
  const offsetPlaceholder = `$${params.length}`;

  const { rows } = await pool.query(
    `SELECT id, event_name, event_date, organizer, organizer_website, organizer_email,
            application_text, venue_street, venue_zip, venue_city, fee, status,
            created_by, created_at, updated_by, updated_at
     FROM bookings
     ${whereSql}
     ORDER BY ${sortColumn} ${sortDirection}
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    params,
  );

  return res.status(200).json({
    data: rows,
    page,
    pageSize: PAGE_SIZE,
    total,
  });
});

const AUTOCOMPLETE_COLUMNS = [
  'organizer',
  'venue_city',
  'venue_zip',
  'venue_street',
  'organizer_email',
  'status',
];

router.get('/suggestions/:field', async (req, res) => {
  const { field } = req.params;
  const { q } = req.query;

  if (!AUTOCOMPLETE_COLUMNS.includes(field)) {
    return res.status(400).json({ error: 'invalid_field' });
  }

  const { rows } = await pool.query(
    `SELECT DISTINCT ${field} AS value FROM bookings
     WHERE ${field} IS NOT NULL AND ${field} != '' ${q ? `AND ${field} ILIKE $1` : ''}
     ORDER BY ${field} LIMIT 10`,
    q ? [`%${q}%`] : [],
  );

  return res.status(200).json(rows.map((row) => row.value));
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query(
    `SELECT id, event_name, event_date, organizer, organizer_website, organizer_email,
            application_text, venue_street, venue_zip, venue_city, fee, status,
            created_by, created_at, updated_by, updated_at
     FROM bookings
     WHERE id = $1`,
    [id],
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'booking_not_found' });
  }

  return res.status(200).json(rows[0]);
});

router.post('/', async (req, res) => {
  const { event_name: eventName } = req.body ?? {};

  if (!eventName || !String(eventName).trim()) {
    return res.status(400).json({ error: 'event_name_required' });
  }

  if (req.body?.status && !STATUS_VALUES.includes(req.body.status)) {
    return res.status(400).json({ error: 'invalid_status' });
  }

  const values = WRITABLE_FIELDS.map((field) => {
    const value = normalizeValue(req.body?.[field]);
    return field === 'status' ? value ?? 'offen' : value;
  });
  const columns = ['created_by', ...WRITABLE_FIELDS];
  const placeholders = columns.map((_, index) => `$${index + 1}`);

  const { rows } = await pool.query(
    `INSERT INTO bookings (${columns.join(', ')})
     VALUES (${placeholders.join(', ')})
     RETURNING id, event_name, event_date, organizer, organizer_website, organizer_email,
               application_text, venue_street, venue_zip, venue_city, fee, status,
               created_by, created_at, updated_by, updated_at`,
    [req.user.username, ...values],
  );

  return res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { event_name: eventName } = req.body ?? {};

  if (!eventName || !String(eventName).trim()) {
    return res.status(400).json({ error: 'event_name_required' });
  }

  if (req.body?.status && !STATUS_VALUES.includes(req.body.status)) {
    return res.status(400).json({ error: 'invalid_status' });
  }

  const values = WRITABLE_FIELDS.map((field) => normalizeValue(req.body?.[field]));
  const setClauses = WRITABLE_FIELDS.map((field, index) =>
    field === 'status' ? `status = COALESCE($${index + 1}, status)` : `${field} = $${index + 1}`,
  );
  setClauses.push(`updated_by = $${values.length + 1}`);
  setClauses.push('updated_at = now()');

  const { rows } = await pool.query(
    `UPDATE bookings
     SET ${setClauses.join(', ')}
     WHERE id = $${values.length + 2}
     RETURNING id, event_name, event_date, organizer, organizer_website, organizer_email,
               application_text, venue_street, venue_zip, venue_city, fee, status,
               created_by, created_at, updated_by, updated_at`,
    [...values, req.user.username, id],
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'booking_not_found' });
  }

  return res.status(200).json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { rowCount } = await pool.query('DELETE FROM bookings WHERE id = $1', [id]);

  if (rowCount === 0) {
    return res.status(404).json({ error: 'booking_not_found' });
  }

  return res.status(204).send();
});

export default router;
