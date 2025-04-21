import path from 'path'
import { cp, readFile, rm, writeFile } from 'fs/promises'

import glob from 'fast-glob'

import { pathRewriter, run } from '../utils'
import { DIST_DIR, PACKAGE_NAME } from '../constants'

export const generateTypesDefinitions = async () => {
  await run(
    'npx vue-tsc -p tsconfig.web.json --declaration --emitDeclarationOnly --declarationDir dist/types'
  )
  const typesDir = path.join(DIST_DIR, 'types', 'packages')
  const filePaths = await glob(`**/*.d.ts`, {
    cwd: typesDir,
    absolute: true
  })
  const rewriteTasks = filePaths.map(async (filePath) => {
    const content = await readFile(filePath, 'utf8')
    await writeFile(filePath, pathRewriter('esm')(content), 'utf8')
  })
  await Promise.all(rewriteTasks)
  const sourceDir = path.join(typesDir, PACKAGE_NAME)
  await cp(sourceDir, typesDir, { recursive: true })
  await rm(sourceDir, { recursive: true })
}
