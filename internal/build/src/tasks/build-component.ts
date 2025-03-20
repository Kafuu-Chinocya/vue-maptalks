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
import { withTaskName, writeBundles } from '../utils'

const banner = `/*! ${PACKAGE_NAME} v${version} */\n`

async function buildFullEntry() {
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
    minifyPlugin({
      target,
      sourceMap: true
    })
  ]

  await using bundle = await rollup({
    input: resolve(COMPONENT_ROOT, 'index.ts'),
    plugins
  })

  await writeBundles(bundle, [
    {
      format: 'esm',
      file: resolve(COMPONENT_ROOT, 'dist', 'index.esm.js'),
      sourcemap: true,
      banner
    },
    {
      format: 'cjs',
      file: resolve(COMPONENT_ROOT, 'dist', 'index.cjs.js'),
      sourcemap: true,
      banner
    }
  ])
}

export const buildComponents = () => async () => Promise.all([buildFullEntry()])

export const buildComponent: TaskFunction = parallel(
  withTaskName('buildComponent', buildComponents())
)
