/* eslint-env worker, serviceworker */

import {checkForUpdate} from '../lib/caches'
const debug = require('../lib/debug')(__filename)

self.addEventListener('message', function (event) {
  debug(event.data)
  const {name, data} = event.data // eslint-disable-line no-unused-vars
  if (name !== 'checkForUpdate') return
  event.waitUntil(async function () {
    try {
      const result = await checkForUpdate()
      event.ports[0].postMessage({name, result})
    } catch (err) {
      console.error(err)
      event.ports[0].postMessage({name, error: err.message})
    }
  }())
})
