/* eslint-env worker, serviceworker */

import {checkForUpdate} from '../lib/caches'
const debug = require('../lib/debug')(__filename)

self.addEventListener('message', function (event) {
  event.waitUntil(async function () {
    try {
      const result = await exec(event.data)
      event.ports[0].postMessage({title: event.data.title, result})
    } catch (err) {
      console.error(err)
      event.ports[0].postMessage({title: event.data.title, error: err.message})
    }
  }())
})

function exec ({title, body}) {
  debug('exec', {title, body})
  switch (title) {
    case 'checkForUpdate':
      return checkForUpdate()
  }
}
