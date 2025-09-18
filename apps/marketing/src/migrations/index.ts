import * as migration_20250918_154420 from './20250918_154420';

export const migrations = [
  {
    up: migration_20250918_154420.up,
    down: migration_20250918_154420.down,
    name: '20250918_154420'
  },
];
