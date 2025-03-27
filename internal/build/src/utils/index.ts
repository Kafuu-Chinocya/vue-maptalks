import { spawn } from 'child_process'

import chalk from 'chalk'
import { consola } from 'consola'
import { type ProjectManifest } from '@pnpm/types'

import {
  BUILD_ROOT,
  ENTRY_PACKAGE_ROOT,
  PACKAGE_PREFIX,
  ROOT_DIR
} from '../constants'
import { type Module, buildConfig } from '../build-info'

import type { OutputOptions, RollupBuild } from 'rollup'
import type { TaskFunction } from 'gulp'

export const generateExternal = (options: { full: boolean }) => {
  const { dependencies, peerDependencies } =
    getPackageDependencies(ENTRY_PACKAGE_ROOT)

  return (id: string) => {
    const packages: string[] = [...peerDependencies]
    if (!options.full) {
      packages.push('@vue', ...dependencies)
    }

    return [...new Set(packages)].some(
      (pkg) => id === pkg || id.startsWith(`${pkg}/`)
    )
  }
}

export function formatBundleFilename(
  name: string,
  minify: boolean,
  ext: string
) {
  return `${name}${minify ? '.min' : ''}.${ext}`
}

// pkg
export const getPackageManifest = (pkgPath: string) => {
  return require(pkgPath) as ProjectManifest
}

export const pathRewriter = (module: Module) => {
  const config = buildConfig[module]

  return (id: string) => {
    id = id.replaceAll(`${PACKAGE_PREFIX}/`, `${config.bundle.path}/`)

    return id
  }
}

export const getPackageDependencies = (
  pkgPath: string
): Record<'dependencies' | 'peerDependencies', string[]> => {
  const manifest = getPackageManifest(pkgPath)
  const { dependencies = {}, peerDependencies = {} } = manifest

  return {
    dependencies: Object.keys(dependencies),
    peerDependencies: Object.keys(peerDependencies)
  }
}

export const excludeFiles = (files: string[]) => {
  const excludes = ['node_modules', 'test', 'mock', 'gulpfile', 'dist']

  return files.filter((path) => {
    const position = path.startsWith(ROOT_DIR) ? ROOT_DIR.length : 0
    return !excludes.some((exclude) => path.includes(exclude, position))
  })
}

export function writeBundles(bundle: RollupBuild, options: OutputOptions[]) {
  return Promise.all(options.map((option) => bundle.write(option)))
}

// process
export const run = async (command: string, cwd: string = ROOT_DIR) =>
  new Promise<void>((resolve, reject) => {
    const [cmd, ...args] = command.split(' ')
    consola.info(`run: ${chalk.green(`${cmd} ${args.join(' ')}`)}`)
    const app = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    })

    const onProcessExit = () => app.kill('SIGHUP')

    app.on('close', (code) => {
      process.removeListener('exit', onProcessExit)

      if (code === 0) resolve()
      else
        reject(
          new Error(`Command failed. \n Command: ${command} \n Code: ${code}`)
        )
    })
    process.on('exit', onProcessExit)
  })

// gulp
export const withTaskName = <T extends TaskFunction>(name: string, fn: T) =>
  Object.assign(fn, { displayName: name })

export const runTask = (name: string) =>
  withTaskName(`shellTask:${name}`, () =>
    run(`pnpm run start ${name}`, BUILD_ROOT)
  )
