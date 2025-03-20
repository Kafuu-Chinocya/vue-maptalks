import { resolve } from 'path'

import { PACKAGE_NAME, PACKAGE_OUTPUT_DIR } from './constants'

import type { ModuleFormat } from 'rollup'

export const modules = ['esm', 'cjs'] as const

export type Module = (typeof modules)[number]

export interface BuildInfo {
  module: 'ESNext' | 'CommonJS'
  format: ModuleFormat
  ext: 'mjs' | 'cjs' | 'js'
  output: {
    name: string
    path: string
  }
  bundle: {
    path: string
  }
}

export const buildConfig: Record<Module, BuildInfo> = {
  esm: {
    module: 'ESNext',
    format: 'esm',
    ext: 'mjs',
    output: {
      name: 'es',
      path: resolve(PACKAGE_OUTPUT_DIR, 'es')
    },
    bundle: {
      path: `${PACKAGE_NAME}/es`
    }
  },
  cjs: {
    module: 'CommonJS',
    format: 'cjs',
    ext: 'js',
    output: {
      name: 'lib',
      path: resolve(PACKAGE_OUTPUT_DIR, 'lib')
    },
    bundle: {
      path: `${PACKAGE_NAME}/lib`
    }
  }
}
export const buildConfigEntries = Object.entries(
  buildConfig
) as BuildConfigEntries

export type BuildConfig = typeof buildConfig
export type BuildConfigEntries = [Module, BuildInfo][]

export const target = 'es2018'
