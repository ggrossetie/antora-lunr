'use strict'

const { posix: path } = require('path')

const SPACE_RX = / /g

function mockContentCatalog (seed = []) {
  if (!Array.isArray(seed)) seed = [seed]
  const familyDirs = {
    alias: 'pages',
    example: 'examples',
    image: 'images',
    nav: '',
    page: 'pages',
    partial: 'pages/_partials',
  }
  const components = {}
  const entries = []
  const entriesById = {}
  const entriesByPath = {}
  const entriesByFamily = {}
  seed.forEach(({ component, version, module: module_, family, relative, contents, mediaType, navIndex, indexify }) => {
    if (component == null) component = 'component-a'
    if (version == null) version = 'master'
    if (module_ == null) module_ = 'module-a'
    if (!family) family = 'page'
    if (!contents) contents = ''
    let versions
    if (component in components) {
      versions = components[component].versions
      if (versions.findIndex((it) => it.version === version) < 0) versions.unshift({ version })
    } else {
      components[component] = { name: component, versions: (versions = [{ version }]) }
    }
    // NOTE assume we want the latest to be the last version we register
    components[component].latest = versions[0]
    const componentVersionKey = buildComponentVersionKey(component, version)
    const componentRelativePath = path.join(module_ ? 'modules' : '', module_, familyDirs[family], relative)
    const entry = {
      path: componentRelativePath,
      dirname: path.dirname(componentRelativePath),
      contents: Buffer.from(contents),
      src: {
        path: componentRelativePath,
        component,
        version,
        module: module_ || undefined,
        relative,
        family,
        basename: path.basename(relative),
        stem: path.basename(relative, path.extname(relative)),
      },
    }
    if (mediaType) entry.src.mediaType = entry.mediaType = mediaType
    const pubVersion = version === 'master' ? '' : version
    const pubModule = module_ === 'ROOT' ? '' : module_
    if (family === 'page' || family === 'alias' || family === 'image') {
      if (!~('/' + relative).indexOf('/_')) {
        const relativeOut = family === 'image' ? relative : relative.slice(0, -5) + (indexify ? '/' : '.html')
        entry.out = {
          path: path.join(component, pubVersion, pubModule, relativeOut),
          moduleRootPath: relative.includes('/')
            ? Array(relative.split('/').length - (indexify ? 0 : 1))
              .fill('..')
              .join('/')
            : indexify
              ? '..'
              : '.',
        }
        let url = '/' + entry.out.path
        if (~url.indexOf(' ')) url = url.replace(SPACE_RX, '%20')
        entry.pub = { url, moduleRootPath: entry.out.moduleRootPath }
      }
    } else if (family === 'nav') {
      entry.pub = {
        url: '/' + path.join(component, pubVersion, pubModule) + '/',
        moduleRootPath: '.',
      }
      entry.nav = { index: navIndex }
    }
    const byIdKey = componentVersionKey + (module_ || '') + ':' + family + '$' + relative
    const byPathKey = componentVersionKey + componentRelativePath
    entries.push(entry)
    entriesById[byIdKey] = entriesByPath[byPathKey] = entry
    if (!(family in entriesByFamily)) entriesByFamily[family] = []
    entriesByFamily[family].push(entry)
  })

  return {
    getComponent: (name) => components[name],
    getComponents: () => Object.values(components),
    getComponentVersion: (component, version) =>
      (typeof component === 'string' ? components[component] : component).versions.find((it) => it.version === version)
  }
}

function buildComponentVersionKey (component, version) {
  return version + '@' + component + ':'
}

module.exports = mockContentCatalog

