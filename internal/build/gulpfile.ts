import path from 'path'
import { copyFile, cp, mkdir } from 'fs/promises'

import { type TaskFunction, parallel, series } from 'gulp'

import {
  DIST_DIR,
  ENTRY_PACKAGE_ROOT,
  type Module,
  ROOT_DIR,
  VUE_MAPTALKS_PACKAGE,
  buildConfig,
  run,
  runTask,
  withTaskName
} from './src'

export const copyFiles = () =>
  Promise.all([
    copyFile(
      VUE_MAPTALKS_PACKAGE,
      path.join(ENTRY_PACKAGE_ROOT, 'package.json')
    ),
    copyFile(
      path.resolve(ROOT_DIR, 'README.md'),
      path.resolve(ENTRY_PACKAGE_ROOT, 'README.md')
    ),
    copyFile(
      path.resolve(ROOT_DIR, 'typings', 'global.d.ts'),
      path.resolve(ENTRY_PACKAGE_ROOT, 'global.d.ts')
    )
  ])

export const copyTypesDefinitions: TaskFunction = (done) => {
  const src = path.resolve(DIST_DIR, 'types', 'packages')
  const copyTypes = (module: Module) =>
    withTaskName(`copyTypes:${module}`, () =>
      cp(src, buildConfig[module].output.path, { recursive: true })
    )

  return parallel(copyTypes('esm'), copyTypes('cjs'))(done)
}

export const copyFullStyle = async () => {
  await mkdir(path.resolve(ENTRY_PACKAGE_ROOT, 'dist'), { recursive: true })
}

export default series(
  withTaskName('clean', () => run('pnpm run clean')),
  withTaskName('createOutput', () =>
    mkdir(ENTRY_PACKAGE_ROOT, { recursive: true })
  ),
  withTaskName('buildComponent', runTask('buildComponent')),

  parallel(
    // runTask('buildModules'),
    runTask('buildFullBundle')
    // runTask('generateTypesDefinitions'),
    // runTask('buildHelper')
  ),

  parallel(copyTypesDefinitions, copyFiles)
)

export * from './src'
