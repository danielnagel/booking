import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import { resetDb, closeDb, insertBooking } from './helpers/db.js';
import { createAndLoginUser } from './helpers/auth.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDb();
});

describe('POST /api/bookings', () => {
  it('creates a booking with only the required event_name field', async () => {
    const { agent, username } = await createAndLoginUser('booker');

    const response = await agent
      .post('/api/bookings')
      .send({ event_name: 'Stadtfest Musterhausen' });

    expect(response.status).toBe(201);
    expect(response.body.event_name).toBe('Stadtfest Musterhausen');
    expect(response.body.id).toBeTruthy();
    expect(response.body.organizer).toBeNull();
    expect(response.body.created_by).toBe(username);
  });

  it('creates a booking with all fields set', async () => {
    const { agent } = await createAndLoginUser('booker');

    const payload = {
      event_name: 'Stadtfest Musterhausen',
      event_date: '2026-09-12',
      organizer: 'Stadt Musterhausen',
      organizer_website: 'https://musterhausen.de',
      organizer_email: 'kultur@musterhausen.de',
      application_text: 'Wir würden gerne auftreten.',
      venue_street: 'Hauptstraße 1',
      venue_zip: '12345',
      venue_city: 'Musterhausen',
      fee: 500,
    };

    const response = await agent.post('/api/bookings').send(payload);

    expect(response.status).toBe(201);
    expect(response.body.event_name).toBe(payload.event_name);
    expect(response.body.organizer).toBe(payload.organizer);
    expect(response.body.venue_city).toBe(payload.venue_city);
    expect(Number(response.body.fee)).toBe(500);
  });

  it('rejects a missing event_name', async () => {
    const { agent } = await createAndLoginUser('booker');

    const response = await agent.post('/api/bookings').send({ organizer: 'Someone' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/event_name/);
  });

  it('rejects a blank event_name', async () => {
    const { agent } = await createAndLoginUser('booker');

    const response = await agent.post('/api/bookings').send({ event_name: '   ' });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/bookings', () => {
  it('lists created bookings', async () => {
    const { agent } = await createAndLoginUser('booker');
    await insertBooking({ event_name: 'Erstes Konzert' });
    await insertBooking({ event_name: 'Zweites Konzert' });

    const response = await agent.get('/api/bookings');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.page).toBe(1);
    expect(response.body.pageSize).toBe(50);
  });

  it('filters results using the search parameter', async () => {
    const { agent } = await createAndLoginUser('booker');
    await insertBooking({ event_name: 'Rockfestival Musterstadt', organizer: 'Musterstadt e.V.' });
    await insertBooking({ event_name: 'Jazzabend', organizer: 'Kulturverein' });

    const response = await agent.get('/api/bookings').query({ search: 'Musterstadt' });

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.data[0].event_name).toBe('Rockfestival Musterstadt');
  });

  it('searches across organizer as well as event_name', async () => {
    const { agent } = await createAndLoginUser('booker');
    await insertBooking({ event_name: 'Sommerfest', organizer: 'Musterstadt Kulturamt' });
    await insertBooking({ event_name: 'Winterfest', organizer: 'Anderer Verein' });

    const response = await agent.get('/api/bookings').query({ search: 'Kulturamt' });

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.data[0].event_name).toBe('Sommerfest');
  });

  it('sorts by the given column and direction', async () => {
    const { agent } = await createAndLoginUser('booker');
    await insertBooking({ event_name: 'Bravo' });
    await insertBooking({ event_name: 'Alpha' });
    await insertBooking({ event_name: 'Charlie' });

    const ascending = await agent
      .get('/api/bookings')
      .query({ sortBy: 'event_name', sortDir: 'asc' });
    expect(ascending.body.data.map((row) => row.event_name)).toEqual([
      'Alpha',
      'Bravo',
      'Charlie',
    ]);

    const descending = await agent
      .get('/api/bookings')
      .query({ sortBy: 'event_name', sortDir: 'desc' });
    expect(descending.body.data.map((row) => row.event_name)).toEqual([
      'Charlie',
      'Bravo',
      'Alpha',
    ]);
  });

  it('paginates using page and a fixed pageSize of 50', async () => {
    const { agent } = await createAndLoginUser('booker');

    const total = 62;
    const insertions = [];
    for (let i = 0; i < total; i += 1) {
      insertions.push(insertBooking({ event_name: `Event ${String(i).padStart(3, '0')}` }));
    }
    await Promise.all(insertions);

    const firstPage = await agent
      .get('/api/bookings')
      .query({ sortBy: 'event_name', sortDir: 'asc', page: 1 });
    const secondPage = await agent
      .get('/api/bookings')
      .query({ sortBy: 'event_name', sortDir: 'asc', page: 2 });

    expect(firstPage.body.total).toBe(total);
    expect(firstPage.body.data).toHaveLength(50);
    expect(firstPage.body.data[0].event_name).toBe('Event 000');

    expect(secondPage.body.total).toBe(total);
    expect(secondPage.body.data).toHaveLength(total - 50);
    expect(secondPage.body.data[0].event_name).toBe('Event 050');
  });
});

describe('GET /api/bookings/:id', () => {
  it('returns a single booking by id', async () => {
    const { agent } = await createAndLoginUser('viewer');
    const booking = await insertBooking({ event_name: 'Einzelnes Fest', organizer: 'Solo e.V.' });

    const response = await agent.get(`/api/bookings/${booking.id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(booking.id);
    expect(response.body.event_name).toBe('Einzelnes Fest');
    expect(response.body.organizer).toBe('Solo e.V.');
  });

  it('returns 404 for a non-existent booking', async () => {
    const { agent } = await createAndLoginUser('viewer');

    const response = await agent.get('/api/bookings/00000000-0000-0000-0000-000000000000');
    expect(response.status).toBe(404);
  });
});

describe('PUT /api/bookings/:id', () => {
  it('updates an existing booking', async () => {
    const { agent, username } = await createAndLoginUser('editor');
    const booking = await insertBooking({ event_name: 'Altes Fest', organizer: 'Alt e.V.' });

    const response = await agent
      .put(`/api/bookings/${booking.id}`)
      .send({ event_name: 'Neues Fest', organizer: 'Neu e.V.' });

    expect(response.status).toBe(200);
    expect(response.body.event_name).toBe('Neues Fest');
    expect(response.body.organizer).toBe('Neu e.V.');
    expect(response.body.updated_by).toBe(username);
    expect(response.body.updated_at).toBeTruthy();
  });

  it('rejects an update with a missing event_name', async () => {
    const { agent } = await createAndLoginUser('editor');
    const booking = await insertBooking({ event_name: 'Altes Fest' });

    const response = await agent
      .put(`/api/bookings/${booking.id}`)
      .send({ organizer: 'Neu e.V.' });

    expect(response.status).toBe(400);
  });

  it('returns 404 for a non-existent booking', async () => {
    const { agent } = await createAndLoginUser('editor');

    const response = await agent
      .put('/api/bookings/00000000-0000-0000-0000-000000000000')
      .send({ event_name: 'Neues Fest' });

    expect(response.status).toBe(404);
  });

  it('allows any logged-in user to edit an entry created by someone else', async () => {
    const booking = await insertBooking({ event_name: 'Fremdes Fest', created_by: 'other-user' });
    const { agent } = await createAndLoginUser('editor');

    const response = await agent
      .put(`/api/bookings/${booking.id}`)
      .send({ event_name: 'Bearbeitetes Fest' });

    expect(response.status).toBe(200);
    expect(response.body.event_name).toBe('Bearbeitetes Fest');
  });
});

describe('DELETE /api/bookings/:id', () => {
  it('deletes an existing booking', async () => {
    const { agent } = await createAndLoginUser('deleter');
    const booking = await insertBooking({ event_name: 'Zu löschendes Fest' });

    const response = await agent.delete(`/api/bookings/${booking.id}`);
    expect(response.status).toBe(204);

    const listResponse = await agent.get('/api/bookings');
    expect(listResponse.body.total).toBe(0);
  });

  it('returns 404 for a non-existent booking', async () => {
    const { agent } = await createAndLoginUser('deleter');

    const response = await agent.delete('/api/bookings/00000000-0000-0000-0000-000000000000');
    expect(response.status).toBe(404);
  });
});
