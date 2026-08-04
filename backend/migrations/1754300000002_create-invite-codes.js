export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('invite_codes', {
    code: {
      type: 'text',
      primaryKey: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    expires_at: {
      type: 'timestamptz',
      notNull: true,
    },
    revoked_at: {
      type: 'timestamptz',
      notNull: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable('invite_codes');
};
