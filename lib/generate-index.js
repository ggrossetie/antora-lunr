'use strict'

const lunr = require('lunr')

/**
 * Generate a Lunr index.
 *
 * Iterates over the specified pages and creates a Lunr index.
 *
 * @memberof generate-index
 *
 * @param {Object} playbook - The configuration object for Antora.
 * @param {Object} playbook.site - Site-related configuration data.
 * @param {String} playbook.site.url - The base URL of the site.
 * @param {Array<File>} pages - The publishable pages to map.
 * @returns {File} A Lunr index.
 */
function generateIndex (playbook, pages) {
  let siteUrl = playbook.site.url
  if (!siteUrl) return undefined
  if (siteUrl.charAt(siteUrl.length - 1) === '/') siteUrl = siteUrl.substr(0, siteUrl.length - 1)
  if (!pages.length) return undefined
  const documents = pages.map((page) => {
    return {
      text: page.contents.toString(),
      component: page.src.component,
      version: page.src.version,
      name: page.src.stem,
      url: siteUrl + page.pub.url
    }
  })
  return lunr(function () {
    this.ref('url')
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
