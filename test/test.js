/* eslint-env mocha */
const chai = require('chai')
const expect = chai.expect
const dirtyChai = require('dirty-chai')
chai.use(dirtyChai)
const generateIndex = require('../lib/index')
const mockContentCatalog = require('./mock-content-catalog.js')

describe('Generate index', () => {
  it('should generate an empty index when there\'s no page', () => {
    const playbook = {
      site: {
        url: 'https://antora.org'
      }
    }
    // no page, no index!
    const pages = []
    const contentCatalog = {}
    const env = {}
    const index = generateIndex(playbook, pages, contentCatalog, env)
    expect(index).to.be.empty()
  })
  it('should generate an index', () => {
    const playbook = {
      site: {
        url: 'https://antora.org/docs/'
      }
    }
    const pages = [{
      contents: Buffer.from('<article class="doc"><p>foo</p></article>'),
      src: {
        component: 'component-a',
        version: '2.0',
        stem: 'install-foo'
      },
      asciidoc: {},
      pub: {
        url: '/component-a/install-foo'
      }
    }]
    const contentCatalog = {}
    const env = {}
    const index = generateIndex(playbook, pages, contentCatalog, env)
    const installPage = index.store['/docs/component-a/install-foo']
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
  it('should generate a document for each titles', () => {
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
      asciidoc: {},
      pub: {
        url: '/antora/1.0/'
      }
    }]
    const contentCatalog = {}
    const env = {}
    const index = generateIndex(playbook, pages, contentCatalog, env)
    const installPage = index.store['/antora/1.0/']
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
      asciidoc: {},
      pub: {
        url: '/antora/1.0/'
      }
    }]
    const contentCatalog = {}
    const env = {}
    const index = generateIndex(playbook, pages, contentCatalog, env)
    const installPage = index.store['/antora/1.0/']
    expect(installPage.text).to.equal('The Static Site Generator for Tech Writers This site hosts the technical documentation for Antora With Antora, you manage docs as code')
    expect(installPage.component).to.equal('hello')
    expect(installPage.version).to.equal('1.0')
    expect(installPage.title).to.equal('Antora Documentation')
    expect(index.index.search('asciidoctor'), '"Asciidoctor" is a navigation title and should not be indexed').to.have.lengthOf(0)
    expect(index.index.search('help'), '"How Antora Can Help" is a navigation item and should not be indexed').to.have.lengthOf(0)
  })
  it('should only index the first document title (heading 1)', () => {
    const playbook = {
      site: {
        url: 'https://docs.antora.org'
      }
    }
    const pages = [{
      contents: Buffer.from(`
<article class="doc">
  <h1 class="page">What’s New in Antora</h1>
  <div id="preamble">
    <div class="sectionbody">
      <div class="paragraph">
        <p>Learn about what’s new in the 2.0 release series of Antora.</p>
      </div>
    </div>
  </div>
  <h1 id="antora-2-0-0" class="sect0"><a class="anchor" href="#antora-2-0-0"></a>Antora 2.0.0</h1>
  <div class="openblock partintro">
    <div class="content">
      <div class="paragraph">
        <p><em><strong>Release date:</strong> 2018.12.25 | <strong>Milestone (closed issues):</strong> <a href="https://gitlab.com/antora/antora/issues?milestone_title=v2.0.x&amp;scope=all&amp;state=closed" target="_blank" rel="noopener">v2.0.x</a></em></p>
      </div>
      <div class="paragraph">
        <p>The Antora 2.0.0 release streamlines the installation process, improves platform and library compatibility, provides a simpler and pluggable authentication mechanism for private repositories, and delivers the latest Asciidoctor capabilities.</p>
      </div>
    </div>
  </div>
</article>`),
      src: {
        component: 'hello',
        version: '1.0',
        stem: ''
      },
      asciidoc: {},
      pub: {
        url: '/antora/1.0/whats-new.html'
      }
    }]
    const contentCatalog = {}
    const env = {}
    const index = generateIndex(playbook, pages, contentCatalog, env)
    const whatsNewPage = index.store['/antora/1.0/whats-new.html']
    expect(whatsNewPage.title).to.equal('What’s New in Antora')
  })
  it('should exclude pages with noindex defined as metadata', () => {
    const playbook = {
      site: {
        url: 'https://docs.antora.org'
      }
    }
    const pages = [{
      contents: Buffer.from(`
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Antora Documentation :: Antora Docs</title>
    <meta name="keywords" content="Docs as Code, DocOps, content management system, docs writers, publish software documentation, CI and docs, CD and docs">
    <meta name="generator" content="Antora 2.0.0">
    <meta name="robots" content="noindex">
  </head>
  <body class="article">
    <main role="main">
      <article class="doc">
        <h1 class="page">Antora Documentation</h1>
        <div class="sect1">
          <h2 id="manage-docs-as-code"><a class="anchor" href="#manage-docs-as-code"></a>Manage docs as code</h2>
          <div class="sectionbody">
            <div class="paragraph">
              <p>With Antora, you manage <strong>docs as code</strong>.
              That means your documentation process benefits from the same practices used to produce successful software.</p>
            </div>
            <div class="paragraph">
              <p>Some of these practices include:</p>
            </div>
            <div class="ulist">
              <ul>
                <li>
                  <p>Storing content in a version control system.</p>
                </li>
                <li>
                  <p>Separating content, configuration, and presentation.</p>
                </li>
                <li>
                  <p>Leveraging automation for compilation, validation, verification, and publishing.</p>
                </li>
                <li>
                  <p>Reusing shared materials (DRY).</p>
                </li>
              </ul>
            </div>
            <div class="paragraph">
              <p>Antora helps you incorporate these practices into your documentation workflow.
              As a result, your documentation is much easier to manage, maintain, and enhance.</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  </body>
</html>`),
      src: {
        component: 'hello',
        version: '1.0',
        stem: ''
      },
      asciidoc: {},
      pub: {
        url: '/antora/1.0/'
      }
    },
    {
      contents: Buffer.from(`
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Antora Documentation :: Antora Docs</title>
  <meta name="keywords" content="Docs as Code, DocOps, content management system, docs writers, publish software documentation, CI and docs, CD and docs">
  <meta name="generator" content="Antora 2.0.0">
  <meta name="robots" content="index">
</head>
<body class="article">
  <main role="main">
    <article class="doc">
      <h1 class="page">How Antora Can Help You and Your Team</h1>
      <div class="sect1">
        <h2 id="agile-and-secure"><a class="anchor" href="#agile-and-secure"></a>Agile and secure</h2>
        <div class="sectionbody">
          <div class="paragraph">
              <p><strong>Automate the assembly of your secure, nimble static site as changes happen instead of wrestling with a CMS giant.</strong></p>
          </div>
          <div class="paragraph">
            <p>Rebuild and deploy your site automatically in a matter of seconds in response to any change.
            Never have to worry about patching security holes in your deployed CMS application since you don’t have one.
            All pages are static—&#8203;in the JAMstack style.
            Need to migrate your site to a different domain?
            Just rebuild the site and relaunch it on the new host.</p>
          </div>
          <div class="paragraph">
            <p><strong>Adapt your site to fit seamlessly with your other web properties.</strong></p>
          </div>
          <div class="paragraph">
            <p>No site is an island.
            Sites must play nice with others to maintain a consistent brand and user experiences.
            Static sites generated by Antora are well-suited for this role.
            With page templates and a little help from an automated process, you can blend your documentation pages into existing sites, giving the impression it’s all part of a single uniform site.</p>
          </div>
        </div>
      </div>
    </article>
  </main>
</body>
</html>`),
      src: {
        component: 'hello',
        version: '1.0',
        stem: ''
      },
      asciidoc: {},
      pub: {
        url: '/antora/1.0/features/'
      }
    }]
    const contentCatalog = {}
    const env = {}
    const index = generateIndex(playbook, pages, contentCatalog, env)
    const privatePage = index.store['/antora/1.0/']
    expect(privatePage).to.be.undefined()
    const featuresPage = index.store['/antora/1.0/features/']
    expect(featuresPage.text).to.equal('Automate the assembly of your secure, nimble static site as changes happen instead of wrestling with a CMS giant. Rebuild and deploy your site automatically in a matter of seconds in response to any change. Never have to worry about patching security holes in your deployed CMS application since you don’t have one. All pages are static—​in the JAMstack style. Need to migrate your site to a different domain? Just rebuild the site and relaunch it on the new host. Adapt your site to fit seamlessly with your other web properties. No site is an island. Sites must play nice with others to maintain a consistent brand and user experiences. Static sites generated by Antora are well-suited for this role. With page templates and a little help from an automated process, you can blend your documentation pages into existing sites, giving the impression it’s all part of a single uniform site.')
  })
  it('should exclude pages with noindex defined as attribute', () => {
    const playbook = {
      site: {
        url: 'https://docs.antora.org'
      }
    }
    const pages = [{
      contents: Buffer.from(`
<html lang="en">
  <body class="article">
    <main role="main">
      <article class="doc">
        <h1 class="page">Antora Documentation</h1>
        <div class="sect1">
          <h2 id="manage-docs-as-code"><a class="anchor" href="#manage-docs-as-code"></a>Manage docs as code</h2>
          <div class="sectionbody">
            <div class="paragraph">
              <p>With Antora, you manage <strong>docs as code</strong>.
              That means your documentation process benefits from the same practices used to produce successful software.</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  </body>
</html>`),
      src: {
        component: 'hello',
        version: '1.0',
        stem: ''
      },
      asciidoc: {
        attributes: {
          noindex: ''
        }
      },
      pub: {
        url: '/antora/1.0/'
      }
    },
    {
      contents: Buffer.from(`
<html lang="en">
<body class="article">
  <main role="main">
    <article class="doc">
      <h1 class="page">How Antora Can Help You and Your Team</h1>
      <div class="sect1">
        <h2 id="agile-and-secure"><a class="anchor" href="#agile-and-secure"></a>Agile and secure</h2>
        <div class="sectionbody">
          <div class="paragraph">
              <p><strong>Automate the assembly of your secure, nimble static site as changes happen instead of wrestling with a CMS giant.</strong></p>
          </div>
        </div>
      </div>
    </article>
  </main>
</body>
</html>`),
      src: {
        component: 'hello',
        version: '1.0',
        stem: ''
      },
      asciidoc: {},
      pub: {
        url: '/antora/1.0/features/'
      }
    }]
    const contentCatalog = {}
    const env = {}
    const index = generateIndex(playbook, pages, contentCatalog, env)
    const privatePage = index.store['/antora/1.0/']
    expect(privatePage).to.be.undefined()
    const featuresPage = index.store['/antora/1.0/features/']
    expect(featuresPage.text).to.equal('Automate the assembly of your secure, nimble static site as changes happen instead of wrestling with a CMS giant.')
  })
  it('if so configured, should only index the latest version when there are multiple versions', () => {
    const playbook = {
      site: {
        url: 'https://docs.antora.org'
      }
    }
    const pages = [{
      contents: Buffer.from(`
<html lang="en">
  <body class="article">
    <main role="main">
      <article class="doc">
        <h1 class="page">Antora Documentation</h1>
        <div class="sect1">
          <h2 id="manage-docs-as-code"><a class="anchor" href="#manage-docs-as-code"></a>Manage docs as code</h2>
          <div class="sectionbody">
            <div class="paragraph">
              <p>With Antora, you manage <strong>docs as code</strong>.
              That means your documentation process benefits from the same practices used to produce successful software.</p>
              <p>In the next version which is not this one, we expect to find Spinnacles</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  </body>
</html>`),
      src: {
        component: 'hello',
        version: '1.0',
        stem: ''
      },
      asciidoc: {},
      pub: {
        url: '/antora/1.0/features/'
      }
    },
    {
      contents: Buffer.from(`
<html lang="en">
<body class="article">
  <main role="main">
    <article class="doc">
      <h1 class="page">How Antora Can Help You and Your Team</h1>
      <div class="sect1">
        <h2 id="agile-and-secure"><a class="anchor" href="#agile-and-secure"></a>Agile and secure</h2>
        <div class="sectionbody">
          <div class="paragraph">
              <p><strong>Automate the assembly of your secure, nimble static site as changes happen instead of wrestling with a CMS giant.</strong></p>
              <p>In the latest version we benefit from having Spinnacles.</p>
          </div>
        </div>
      </div>
    </article>
  </main>
</body>
</html>`),
      src: {
        component: 'hello',
        version: '1.5',
        stem: ''
      },
      asciidoc: {},
      pub: {
        url: '/antora/1.5/features/'
      }
    }]
    const contentCatalog = mockContentCatalog(
      [{
        component: 'hello',
        version: '1.0',
        module: 'module-a',
        family: 'page'
      },
      {
        component: 'hello',
        version: '1.5',
        module: 'module-a',
        family: 'page'
      }])
    const env = { DOCSEARCH_INDEX_VERSION: 'latest' }
    const index = generateIndex(playbook, pages, contentCatalog, env)
    expect(index.index.search('spinnacle').length).to.equal(1)
  })
  describe('Paths', () => {
    it('should use relative links when site URL is not defined', () => {
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
      const contentCatalog = {}
      const env = {}
      const index = generateIndex(playbook, pages, contentCatalog, env)
      expect(index.store['/component-a/install-foo'].url).to.equal('/component-a/install-foo')
    })
    it('should use relative links when site URL is a relative path', () => {
      const playbook = {
        site: {
          url: '/docs'
        }
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
      const contentCatalog = {}
      const env = {}
      const index = generateIndex(playbook, pages, contentCatalog, env)
      expect(index.store['/docs/component-a/install-foo'].url).to.equal('/docs/component-a/install-foo')
    })
    it('should use absolute links when site URL is an absolute local path (using file:// protocol)', () => {
      const playbook = {
        site: {
          url: 'file:///path/to/docs'
        }
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
      const contentCatalog = {}
      const env = {}
      const index = generateIndex(playbook, pages, contentCatalog, env)
      expect(index.store['/path/to/docs/component-a/install-foo'].url).to.equal('/path/to/docs/component-a/install-foo')
    })
  })
})
