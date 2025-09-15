import * as migration_20250915_221429 from './20250915_221429';

export const migrations = [
  {
    up: migration_20250915_221429.up,
    down: migration_20250915_221429.down,
    name: '20250915_221429'
  },
];
