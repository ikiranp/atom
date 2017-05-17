'use strict'

const CompileCache = require('../../src/compile-cache')
const fs = require('fs-extra')
const glob = require('glob')
const path = require('path')

const CONFIG = require('../config')
const runApmInstall = require('./run-apm-install')

require('colors')


module.exports = function () {
  console.log(`Transpiling packages with custom transpiler configurations in ${CONFIG.intermediateAppPath}`)
  for (let packageName of Object.keys(CONFIG.appMetadata.packageDependencies)) {
    const packagePath = path.join(CONFIG.intermediateAppPath, 'node_modules', packageName)
    const metadataPath = path.join(packagePath, 'package.json')
    const metadata = require(metadataPath)
    if (metadata.atomTranspilers) {
      console.log(' transpiling for package '.cyan + packageName.cyan)
      const nodeModulesPath = path.join(packagePath, 'node_modules')
      const nodeModulesBackupPath = path.join(packagePath, 'node_modules.bak')
      fs.copySync(nodeModulesPath, nodeModulesBackupPath)
      runApmInstall(packagePath)

      CompileCache.addTranspilerConfigForPath(packagePath, metadata.name, metadata, metadata.atomTranspilers)
      for (let config of metadata.atomTranspilers) {
        const pathsToCompile = glob.sync(path.join(packagePath, config.glob), {nodir: true})
        pathsToCompile.forEach(transpilePath)
      }

      fs.removeSync(nodeModulesPath)
      fs.renameSync(nodeModulesBackupPath, nodeModulesPath)
    }
  }
}

function transpilePath (path) {
  fs.writeFileSync(path, CompileCache.addPathToCache(path, CONFIG.atomHomeDirPath))
}
