'use strict'

const lunr = require('lunr')

/**
 * Generate a Lunr index.
 *
 * Iterates over the specified pages and creates a Lunr index.
 *
 * @memberof generate-index
 *
 * @param {Array<File>} pages - The publishable pages to map.
 * @returns {Object} A Lunr index.
 */
function generateIndex (pages) {
  const documents = pages.map((page) => {
    return {
      text: page.contents.toString(),
      component: page.src.component,
      version: page.src.version,
      name: page.src.stem,
      path: page.src.path
    }
  })
  return lunr(function () {
    this.ref('path')
    this.field('name')
    this.field('text')
    this.field('component')
    this.field('version')
    documents.forEach(function (doc) {
      this.add(doc)
    }, this)
  })
}

function createIndexFile (index) {
  return {
    mediaType: 'application/json',
    contents: Buffer.from(JSON.stringify(index), 'utf-8'),
    src: { stem: 'lunr-index' },
    out: { path: 'lunr-index.json' },
    pub: { url: '/lunr-index.json', rootPath: '' },
  }
}

module.exports = generateIndex
module.exports.createIndexFile = createIndexFile