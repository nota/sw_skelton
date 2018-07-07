/* eslint-env worker, serviceworker */

import {checkForUpdate} from '../lib/caches'
const debug = require('../lib/debug')(__filename)

self.addEventListener('message', function (event) {
  event.waitUntil(async function () {
    try {
      const result = await exec(event.data)
      event.ports[0].postMessage({name: event.name, result})
    } catch (err) {
      console.error(err)
      event.ports[0].postMessage({name: event.name, error: err.message})
    }
  }())
})

function exec ({name, data}) {
  debug('exec', {name, data})
  switch (name) {
    case 'checkForUpdate':
      return checkForUpdate()
  }
}
