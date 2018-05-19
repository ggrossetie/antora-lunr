/* eslint-env mocha */
const chai = require('chai')
const expect = chai.expect
const dirtyChai = require('dirty-chai')
chai.use(dirtyChai);
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
  it('should generate an empty index when there\'s no url', function () {
    const playbook = {
      site: {} // no site url, no index!
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
    expect(index).to.be.empty()
  })
  it('should generate an index', function () {
    const playbook = {
      site: {
        url: 'https://antora.org'
      }
    }
    const pages = [{
      contents: Buffer.from('<p>foo</p>'),
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
    const installPage = index.store['https://antora.org/component-a/install-foo'];
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
})
