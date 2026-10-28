import * as migration_20261028_175604_initial from './20261028_175604_initial';

export const migrations = [
  {
    up: migration_20261028_175604_initial.up,
    down: migration_20261028_175604_initial.down,
    name: '20261028_175604_initial'
  },
];
