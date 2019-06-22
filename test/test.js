/* eslint-env mocha */
const chai = require('chai')
const expect = chai.expect
const dirtyChai = require('dirty-chai')
chai.use(dirtyChai)
const generateIndex = require('../lib/index')

describe('Generate index', function () {
  it('should generate an empty index when there\'s no page', function () {
    const playbook = {
      site: {
        url: 'https://antora.org'
      }
    }
    // no page, no index!
    const pages = []
    const index = generateIndex(playbook, pages)
    expect(index).to.be.empty()
  })
  it('should use relative links when site URL is not define', function () {
    const playbook = {
      site: {} // site.url is undefined
    }
    const pages = [{
      contents: Buffer.from('foo'),
      src: {
        component: 'component-a',
        version: '2.0',
        stem: 'install-foo'
      },
      pub: {
        url: '/component-a/install-foo'
      }
    }]
    const index = generateIndex(playbook, pages)
    expect(index.store['/component-a/install-foo'].url).to.equal('/component-a/install-foo')
  })
  it('should generate an index', function () {
    const playbook = {
      site: {
        url: 'https://antora.org'
      }
    }
    const pages = [{
      contents: Buffer.from('<article class="doc"><p>foo</p></article>'),
      src: {
        component: 'component-a',
        version: '2.0',
        stem: 'install-foo'
      },
      pub: {
        url: '/component-a/install-foo'
      }
    }]
    const index = generateIndex(playbook, pages)
    const installPage = index.store['https://antora.org/component-a/install-foo']
    expect(installPage.text).to.equal('foo')
    expect(installPage.component).to.equal('component-a')
    expect(installPage.version).to.equal('2.0')
    expect(index.index.search('foo'), 'foo is present in contents').to.have.lengthOf(1)
    expect(index.index.search('2.0'), '2.0 is not indexed').to.be.empty()
    expect(index.index.search('bar'), 'bar is not present').to.be.empty()
    expect(index.index.search('install-foo'), 'install-foo is present in url').to.have.lengthOf(1)
    expect(index.index.search('component-a'), 'component-a is present in component').to.have.lengthOf(1)
    expect(index.index.search('*foo*'), '*foo* is present in contents').to.have.lengthOf(1)
    expect(index.index.search('foo*'), 'foo* is present in contents').to.have.lengthOf(1)
  })
  it('should generate an document for each titles', function () {
    const playbook = {
      site: {
        url: 'https://docs.antora.org'
      }
    }
    const pages = [{
      contents: Buffer.from(`
<article class="doc">
  <h1>Antora Documentation</h1>
  <p>The Static Site Generator for Tech Writers</p>
  <p>This site hosts the technical documentation for Antora</p>
  <h2 id="manage-docs-as-code">Manage docs as code</h2>
  <p>With Antora, you manage docs as code</p>
  <h3 id="where-to-begin">Where to begin</h3>
  <h4 id="navigation">Navigation</h4>
  <h5 id="link-types-syntax">Link Types & Syntax</h5>
  <h6 id="page-links">Page Links</h6>
</article>`),
      src: {
        component: 'hello',
        version: '1.0',
        stem: ''
      },
      pub: {
        url: '/antora/1.0/'
      }
    }]
    const index = generateIndex(playbook, pages)
    const installPage = index.store['https://docs.antora.org/antora/1.0/']
    expect(installPage.text).to.equal('The Static Site Generator for Tech Writers This site hosts the technical documentation for Antora With Antora, you manage docs as code')
    expect(installPage.component).to.equal('hello')
    expect(installPage.version).to.equal('1.0')
    expect(installPage.title).to.equal('Antora Documentation')
    expect(index.index.search('1.0'), 'version is not indexed').to.be.empty()
    expect(index.index.search('bar'), 'bar is not present').to.be.empty()
    expect(index.index.search('where to begin'), '"Where to begin" is indexed as a title').to.have.lengthOf(1)
    expect(index.index.search('docs as code'), '"docs as code" is indexed two times').to.have.lengthOf(2)
    expect(index.index.search('technical'), '"technical" is indexed').to.have.lengthOf(1)
    expect(index.index.search('hello'), '"hello" is indexed as component').to.have.lengthOf(1)
  })
  it('should not index navigation titles', () => {
    const playbook = {
      site: {
        url: 'https://docs.antora.org'
      }
    }
    const pages = [{
      contents: Buffer.from(`
<aside class="navigation">
  <nav class="nav-menu">
    <h3 class="title"><a href="./">Asciidoctor</a></h3>
      <ul class="nav-list">
        <li class="nav-item">How Asciidoctor Can Help</li>
        <li class="nav-item">How Asciidoctor Works</li>
      </ul>
    </nav>
</aside>
<article class="doc">
  <h1>Antora Documentation</h1>
  <p>The Static Site Generator for Tech Writers</p>
  <p>This site hosts the technical documentation for Antora</p>
  <h2 id="manage-docs-as-code">Manage docs as code</h2>
  <p>With Antora, you manage docs as code</p>
  <h3 id="where-to-begin">Where to begin</h3>
  <h4 id="navigation">Navigation</h4>
  <h5 id="link-types-syntax">Link Types & Syntax</h5>
  <h6 id="page-links">Page Links</h6>
</article>`),
      src: {
        component: 'hello',
        version: '1.0',
        stem: ''
      },
      pub: {
        url: '/antora/1.0/'
      }
    }]
    const index = generateIndex(playbook, pages)
    const installPage = index.store['https://docs.antora.org/antora/1.0/']
    expect(installPage.text).to.equal('The Static Site Generator for Tech Writers This site hosts the technical documentation for Antora With Antora, you manage docs as code')
    expect(installPage.component).to.equal('hello')
    expect(installPage.version).to.equal('1.0')
    expect(installPage.title).to.equal('Antora Documentation')
    expect(index.index.search('asciidoctor'), '"Asciidoctor" is a navigation title and should not be indexed').to.have.lengthOf(0)
    expect(index.index.search('help'), '"How Antora Can Help" is a navigation item and should not be indexed').to.have.lengthOf(0)
  })
})
