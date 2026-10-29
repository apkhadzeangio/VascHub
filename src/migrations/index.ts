import * as migration_20261028_175604_initial from './20261028_175604_initial'
import * as migration_20261028_201729_homepage from './20261028_201729_homepage'
import * as migration_20261028_212007_clinical_library from './20261028_212007_clinical_library'

export const migrations = [
  {
    up: migration_20261028_175604_initial.up,
    down: migration_20261028_175604_initial.down,
    name: '20261028_175604_initial',
  },
  {
    up: migration_20261028_201729_homepage.up,
    down: migration_20261028_201729_homepage.down,
    name: '20261028_201729_homepage',
  },
  {
    up: migration_20261028_212007_clinical_library.up,
    down: migration_20261028_212007_clinical_library.down,
    name: '20261028_212007_clinical_library',
  },
]
