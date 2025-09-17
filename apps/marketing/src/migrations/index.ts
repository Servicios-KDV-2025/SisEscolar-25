import * as migration_20250917_160033 from './20250917_160033';

export const migrations = [
  {
    up: migration_20250917_160033.up,
    down: migration_20250917_160033.down,
    name: '20250917_160033'
  },
];
