'use strict'

// The name of the package in order to give the Antora logger a useful name
const { name: packageName } = require('../package.json')
const generateIndex = require('./generate-index')

function register (pipeline, {
  config: { indexLatestOnly, languages, ...extraArguments }
}) {
  const logger = pipeline.require('@antora/logger').get(packageName)

  if (Object.keys(extraArguments).length > 0) {
    const args = Object.keys(extraArguments)
      .map((x) => `"${x}"`)
      .join(', ')
    throw new Error(`Remove unrecognized extension option(s) for ${packageName}: ${args}`)
  }

  pipeline.on('beforePublish', ({ playbook, siteCatalog, contentCatalog }) => {
    const index = generateIndex(playbook, contentCatalog, {
      indexLatestOnly,
      languages
    }, logger)
    siteCatalog.addFile(generateIndex.createIndexFile(index))
  })
}

module.exports = register
