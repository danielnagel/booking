export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('bookings', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    event_name: {
      type: 'text',
      notNull: true,
    },
    event_date: {
      type: 'date',
      notNull: false,
    },
    organizer: {
      type: 'text',
      notNull: false,
    },
    organizer_website: {
      type: 'text',
      notNull: false,
    },
    organizer_email: {
      type: 'text',
      notNull: false,
    },
    application_text: {
      type: 'text',
      notNull: false,
    },
    venue_street: {
      type: 'text',
      notNull: false,
    },
    venue_zip: {
      type: 'text',
      notNull: false,
    },
    venue_city: {
      type: 'text',
      notNull: false,
    },
    fee: {
      type: 'numeric',
      notNull: false,
    },
    created_by: {
      type: 'text',
      notNull: false,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_by: {
      type: 'text',
      notNull: false,
    },
    updated_at: {
      type: 'timestamptz',
      notNull: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable('bookings');
};
