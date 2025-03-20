import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

export const PACKAGE_NAME = 'vue-maptalks'
export const PACKAGE_PREFIX = `@${PACKAGE_NAME}`
export const ROOT_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..'
)
export const DIST_DIR = resolve(ROOT_DIR, 'dist')
export const PACKAGE_OUTPUT_DIR = resolve(DIST_DIR, PACKAGE_NAME)
export const PACKAGE_ROOT = resolve(ROOT_DIR, 'packages')
export const HOOK_ROOT = resolve(PACKAGE_ROOT, 'hooks')
export const UTILS_ROOT = resolve(PACKAGE_ROOT, 'utils')
export const ENTRY_PACKAGE_ROOT = resolve(PACKAGE_ROOT, PACKAGE_NAME)
export const BUILD_ROOT = resolve(ROOT_DIR, 'internal', 'build')

export const VUE_MAPTALKS_PACKAGE = resolve(ENTRY_PACKAGE_ROOT, 'package.json')
