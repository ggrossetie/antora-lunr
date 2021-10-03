'use strict'

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* This source code is taken frome the Antora test suite with some removals
 *  see https://gitlab.com/antora/antora/-/blob/master/test/mock-content-catalog.js
 *  Copyright © 2017-2020 by OpenDevise Inc. and the individual contributors to Antora. */

function mockContentCatalog (seed = [], pages = []) {
  if (!Array.isArray(seed)) seed = [seed]
  const components = {}
  seed.forEach(({ component, version, module: module_, family }) => {
    if (component == null) component = 'component-a'
    if (version == null) version = 'master'
    if (module_ == null) module_ = 'module-a'
    if (!family) family = 'page'
    let versions
    if (component in components) {
      versions = components[component].versions
      if (versions.findIndex((it) => it.version === version) < 0) versions.unshift({ version })
    } else {
      components[component] = { name: component, versions: (versions = [{ version }]) }
    }
    // NOTE assume we want the latest to be the last version we register
    components[component].latest = versions[0]
  })

  return {
    getComponent: (name) => components[name],
    getComponents: () => Object.values(components),
    getComponentVersion: (component, version) =>
      (typeof component === 'string' ? components[component] : component).versions.find((it) => it.version === version),
    getPages: () => pages
  }
}

module.exports = mockContentCatalog
