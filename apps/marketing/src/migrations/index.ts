import * as migration_20250917_175720 from './20250917_175720';

export const migrations = [
  {
    up: migration_20250917_175720.up,
    down: migration_20250917_175720.down,
    name: '20250917_175720'
  },
];
