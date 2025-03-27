import path from 'path'

import { type OutputOptions, rollup } from 'rollup'
import { type TaskFunction, series } from 'gulp'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import VueMacros from 'vue-macros/rollup'
import nodeResolve from '@rollup/plugin-node-resolve'
import glob from 'fast-glob'
import esbuild from 'rollup-plugin-esbuild'
import commonjs from '@rollup/plugin-commonjs'

import {
  excludeFiles,
  generateExternal,
  withTaskName,
  writeBundles
} from '../utils'
import { buildConfigEntries, target } from '../build-info'
import { ENTRY_PACKAGE_ROOT, PACKAGE_ROOT } from '../constants'

const plugins = [
  VueMacros({
    setupComponent: false,
    setupSFC: false,
    plugins: {
      vue: Vue(),
      vueJsx: VueJsx()
    }
  }),
  nodeResolve({
    extensions: ['.mjs', '.js', '.json', '.ts']
  }),
  commonjs(),
  esbuild({
    sourceMap: true,
    target,
    loaders: {
      '.vue': 'ts'
    }
  })
]

async function buildModulesComponents() {
  const input = excludeFiles(
    await glob(['**/*.{js,ts,vue}', '!**/style/(index|css).{js,ts,vue}'], {
      cwd: PACKAGE_ROOT,
      absolute: true,
      onlyFiles: true
    })
  )
  const bundle = await rollup({
    input,
    plugins,
    external: await generateExternal({ full: false }),
    treeshake: { moduleSideEffects: false }
  })

  await writeBundles(
    bundle,
    buildConfigEntries.map(([module, config]): OutputOptions => {
      return {
        format: config.format,
        dir: config.output.path,
        exports: module === 'cjs' ? 'named' : undefined,
        preserveModules: true,
        preserveModulesRoot: ENTRY_PACKAGE_ROOT,
        sourcemap: true,
        entryFileNames: `[name].${config.ext}`
      }
    })
  )
}

async function buildModulesStyles() {
  const input = excludeFiles(
    await glob('**/style/(index|css).{js,ts,vue}', {
      cwd: PACKAGE_ROOT,
      absolute: true,
      onlyFiles: true
    })
  )

  if (!input.length) return

  const bundle = await rollup({
    input,
    plugins,
    treeshake: false
  })

  await writeBundles(
    bundle,
    buildConfigEntries.map(([module, config]): OutputOptions => {
      return {
        format: config.format,
        dir: path.resolve(config.output.path, 'components'),
        exports: module === 'cjs' ? 'named' : undefined,
        preserveModules: true,
        preserveModulesRoot: ENTRY_PACKAGE_ROOT,
        sourcemap: true,
        entryFileNames: `[name].${config.ext}`
      }
    })
  )
}

export const buildModules: TaskFunction = series(
  withTaskName('buildModulesComponents', buildModulesComponents),
  withTaskName('buildModulesStyles', buildModulesStyles)
)
