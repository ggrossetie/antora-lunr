'use strict'

const lunr = require('lunr')
const cheerio = require('cheerio')
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
  if (!siteUrl) {
    // Uses relative links when site URL is not set
    siteUrl = ''
  }
  if (siteUrl.charAt(siteUrl.length - 1) === '/') siteUrl = siteUrl.substr(0, siteUrl.length - 1)
  if (!pages.length) return {}
  // Map of Lunr ref to document
  const documentsStore = {}
  const documents = pages.map((page) => {
    const html = page.contents.toString()
    const $ = cheerio.load(html)
    const $h1 = $('h1')
    const documentTitle = $h1.text()
    $h1.remove()
    const titles = []
    $('h2,h3,h4,h5,h6').each(function () {
      let $title = $(this)
      // If the title does not have an Id then Lunr will throw a TypeError
      // cannot read property 'text' of undefined.
      if ($title.attr('id')) {
        titles.push({
          text: $title.text(),
          id: $title.attr('id')
        })
      }
      $title.remove()
    })
    // HTML document as text
    let text = $('article').text()
    // Decode HTML
    text = entities.decode(text)
    // Strip HTML tags
    text = text.replace(/(<([^>]+)>)/ig, '')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return {
      text: text,
      title: documentTitle,
      component: page.src.component,
      version: page.src.version,
      name: page.src.stem,
      url: siteUrl + page.pub.url,
      titles: titles // TODO get title id to be able to use fragment identifier
    }
  })

  const index = lunr(function () {
    const self = this
    self.ref('url')
    self.field('title', { boost: 10 })
    self.field('name')
    self.field('text')
    self.field('component')
    self.metadataWhitelist = ['position']
    documents.forEach(function (doc) {
      self.add(doc)
      doc.titles.forEach(function (title) {
        self.add({
          title: title.text,
          url: `${doc.url}#${title.id}`
        })
      }, self)
    }, self)
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
    pub: { url: '/search_index.json', rootPath: '' }
  }
}

module.exports = generateIndex
module.exports.createIndexFile = createIndexFile
