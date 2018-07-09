/* eslint-env worker, serviceworker */

import {checkForUpdate} from '../lib/caches'
const debug = require('../lib/debug')(__filename)

self.addEventListener('message', function (event) {
  debug(event.data)
  event.waitUntil(async function () {
    if (event.data !== 'checkForUpdate') return
    let ret
    try {
      ret = await checkForUpdate()
    } catch (err) {
      console.error(err)
      ret = {error: err.message}
    }
    event.ports[0].postMessage(ret)
  }())
})
