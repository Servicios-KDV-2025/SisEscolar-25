import * as migration_20250917_175720 from './20250917_175720';
import * as migration_20250917_184355 from './20250917_184355';

export const migrations = [
  {
    up: migration_20250917_175720.up,
    down: migration_20250917_175720.down,
    name: '20250917_175720',
  },
  {
    up: migration_20250917_184355.up,
    down: migration_20250917_184355.down,
    name: '20250917_184355'
  },
];
