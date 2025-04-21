import { resolve } from 'path'

import { rollup } from 'rollup'
import { type TaskFunction, parallel } from 'gulp'
import VueMacros from 'vue-macros/rollup'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import nodeResolve from '@rollup/plugin-node-resolve'
import esbuild, { minify as minifyPlugin } from 'rollup-plugin-esbuild'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'

import {
  ENTRY_PACKAGE_ROOT,
  PACKAGE_NAME,
  PACKAGE_OUTPUT_DIR
} from '../constants'
import { version } from '../../../../packages/vue-maptalks/version'
import {
  formatBundleFilename,
  generateExternal,
  withTaskName,
  writeBundles
} from '../utils'
import { target } from '../build-info'

const banner = `/*! ${PACKAGE_NAME} v${version} */\n`

async function buildFullEntry(minify: boolean) {
  const plugins = [
    VueMacros({
      setupComponent: false,
      setupSFC: false,
      plugins: {
        vue: Vue({
          isProduction: true,
          template: {
            compilerOptions: {
              hoistStatic: false,
              cacheHandlers: false
            }
          }
        }),
        vueJsx: VueJsx()
      }
    }),
    nodeResolve({
      extensions: ['.mjs', '.js', '.json', '.ts']
    }),
    commonjs(),
    esbuild({
      exclude: [],
      sourceMap: minify,
      target,
      loaders: {
        '.vue': 'ts'
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('production')
      },
      treeShaking: true,
      legalComments: 'eof'
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    minify &&
      minifyPlugin({
        target,
        sourceMap: true
      })
  ]

  await using bundle = await rollup({
    input: resolve(ENTRY_PACKAGE_ROOT, 'index.ts'),
    plugins,
    external: await generateExternal({ full: true }),
    treeshake: true
  })

  await writeBundles(bundle, [
    {
      format: 'umd',
      file: resolve(
        PACKAGE_OUTPUT_DIR,
        'dist',
        formatBundleFilename('index.full', minify, 'js')
      ),
      exports: 'named',
      name: PACKAGE_NAME,
      globals: {
        vue: 'Vue',
        'maptalks-gl': 'maptalks'
      },
      sourcemap: minify,
      banner
    },
    {
      format: 'esm',
      file: resolve(
        PACKAGE_OUTPUT_DIR,
        'dist',
        formatBundleFilename('index.full', minify, 'mjs')
      ),
      sourcemap: minify,
      banner
    }
  ])
}

export const buildFull = (minify: boolean) => async () =>
  Promise.all([buildFullEntry(minify)])

export const buildFullBundle: TaskFunction = parallel(
  withTaskName('buildFullMinified', buildFull(true)),
  withTaskName('buildFull', buildFull(false))
)
