/* eslint-env mocha */
const fs = require('fs')
const rimrafSync = require('rimraf')
const chai = require('chai')
const expect = chai.expect
const path = require('path')
const dirtyChai = require('dirty-chai')
chai.use(dirtyChai)

const generateSite = require('@antora/site-generator-default')

describe('Generate site', () => {
  beforeEach(() => {
    rimrafSync(path.join(__dirname, 'docs/public'), (error) => { if (error) { throw error } })
  })
  it('should generate a site with a search index', async () => {
    // NOTE: While all configuration is passed along with the pipeline configuration, see playbook,
    //       the supplemental_ui and its' search field are dependant on the environment variables
    await generateSite([`--playbook=${path.join(__dirname, 'docs/playbook.yml')}`], {
      DOCSEARCH_ENABLED: 'true'
    })
    global.window = {}
    global.window.antoraLunr = {}
    global.window.antoraLunr.init = (index) => {
      expect(index.store['/antora-lunr/index.html'].title).to.equal('Antora x Lunr')
      expect(index.store['/antora-lunr/index.html'].url).to.equal('/antora-lunr/index.html')
    }
    require('./docs/public/search-index.js')

    const cheerio = require('cheerio')
    const $ = cheerio.load(fs.readFileSync(path.join(__dirname, 'docs/public/antora-lunr/index.html')))
    expect($('#search-input').length).to.equal(1)
  })
})
