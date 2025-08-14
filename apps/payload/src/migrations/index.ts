import * as migration_20250730_215041 from './20250730_215041';
import * as migration_20250801_221136 from './20250801_221136';
import * as migration_20250804_160111 from './20250804_160111';

export const migrations = [
  {
    up: migration_20250730_215041.up,
    down: migration_20250730_215041.down,
    name: '20250730_215041',
  },
  {
    up: migration_20250801_221136.up,
    down: migration_20250801_221136.down,
    name: '20250801_221136',
  },
  {
    up: migration_20250804_160111.up,
    down: migration_20250804_160111.down,
    name: '20250804_160111'
  },
];
