'use strict'

const lunr = require('lunr')
const Entities = require('html-entities').AllHtmlEntities
const entities = new Entities()

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
 * @returns {Object} An JSON object with a Lunr index and a documents store.
 */
function generateIndex (playbook, pages) {
  let siteUrl = playbook.site.url
  if (!siteUrl) return {}
  if (siteUrl.charAt(siteUrl.length - 1) === '/') siteUrl = siteUrl.substr(0, siteUrl.length - 1)
  if (!pages.length) return {}
  // Map of Lunr ref to document
  const documentsStore = {};
  const documents = pages.map((page) => {
    let text = page.contents.toString()
    // Decode HTML
    text = entities.decode(text)
    // Strip HTML tags
    text = text.replace(/(<([^>]+)>)/ig, '')
    return {
      text: text,
      component: page.src.component,
      version: page.src.version,
      name: page.src.stem,
      url: siteUrl + page.pub.url
    }
  })

  const index = lunr(function () {
    this.ref('url')
    this.field('name')
    this.field('text')
    this.field('component')
    documents.forEach(function (doc) {
      this.add(doc)
    }, this)
  })
  documents.forEach(function (doc) {
    documentsStore[doc.url] = doc
  })
  return {
    index: index,
    store: documentsStore
  }
}

function createIndexFile (index) {
  return {
    mediaType: 'application/json',
    contents: Buffer.from(JSON.stringify(index), 'utf-8'),
    src: { stem: 'search_index' },
    out: { path: 'search_index.json' },
    pub: { url: '/search_index.json', rootPath: '' },
  }
}

module.exports = generateIndex
module.exports.createIndexFile = createIndexFile
