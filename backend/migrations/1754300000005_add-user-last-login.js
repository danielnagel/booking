export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumns('users', {
    last_login_at: {
      type: 'timestamptz',
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumns('users', ['last_login_at']);
};
