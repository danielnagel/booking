export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumns('bookings', {
    contact_person: {
      type: 'text',
      notNull: false,
    },
    organizer_phone: {
      type: 'text',
      notNull: false,
    },
    organizer_facebook: {
      type: 'text',
      notNull: false,
    },
    organizer_instagram: {
      type: 'text',
      notNull: false,
    },
    last_contact_date: {
      type: 'date',
      notNull: false,
    },
    notes: {
      type: 'text',
      notNull: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumns('bookings', [
    'contact_person',
    'organizer_phone',
    'organizer_facebook',
    'organizer_instagram',
    'last_contact_date',
    'notes',
  ]);
};
