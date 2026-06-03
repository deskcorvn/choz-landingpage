import * as migration_20260409_155721_initial from './20260409_155721_initial';
import * as migration_20260603_065317_add_missing_collections from './20260603_065317_add_missing_collections';

export const migrations = [
  {
    up: migration_20260409_155721_initial.up,
    down: migration_20260409_155721_initial.down,
    name: '20260409_155721_initial',
  },
  {
    up: migration_20260603_065317_add_missing_collections.up,
    down: migration_20260603_065317_add_missing_collections.down,
    name: '20260603_065317_add_missing_collections'
  },
];
