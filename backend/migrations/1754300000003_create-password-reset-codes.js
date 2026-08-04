export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('password_reset_codes', {
    code: {
      type: 'text',
      primaryKey: true,
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
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
    used_at: {
      type: 'timestamptz',
      notNull: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable('password_reset_codes');
};
