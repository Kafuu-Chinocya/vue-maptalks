import { resolve } from 'path'

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import { rollup } from 'rollup'
import esbuild, { minify as minifyPlugin } from 'rollup-plugin-esbuild'
import VueMacros from 'vue-macros/rollup'
import { TaskFunction, parallel } from 'gulp'

import { version } from '../../../../packages/vue-maptalks/version'
import { target } from '../build-info'
import { COMPONENT_ROOT, PACKAGE_NAME } from '../constants'
import { formatBundleFilename, withTaskName, writeBundles } from '../utils'

const banner = `/*! ${PACKAGE_NAME} v${version} */\n`

async function buildFullEntry(minify: boolean) {
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
      exclude: [],
      sourceMap: true,
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
    input: resolve(COMPONENT_ROOT, 'index.ts'),
    plugins,
    treeshake: true
  })

  await writeBundles(bundle, [
    {
      format: 'esm',
      file: resolve(
        COMPONENT_ROOT,
        'dist',
        formatBundleFilename('index', minify, 'mjs')
      ),
      sourcemap: minify,
      banner
    },
    {
      format: 'cjs',
      file: resolve(
        COMPONENT_ROOT,
        'dist',
        formatBundleFilename('index', minify, 'js')
      ),
      sourcemap: minify,
      banner
    }
  ])
}

export const buildFullComponents = (minify: boolean) => async () =>
  Promise.all([buildFullEntry(minify)])

export const buildComponents: TaskFunction = parallel(
  withTaskName('buildComponentsMinified', buildFullComponents(true)),
  withTaskName('buildComponents', buildFullComponents(false))
)
