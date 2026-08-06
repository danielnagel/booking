export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumns('bookings', {
    status: {
      type: 'text',
      notNull: true,
      default: 'offen',
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumns('bookings', ['status']);
};
