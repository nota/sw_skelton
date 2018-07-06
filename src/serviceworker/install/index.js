/* eslint-env worker, serviceworker */

import {checkForUpdate} from '../lib/caches'
const debug = require('../lib/debug')(__filename)

self.addEventListener('install', function (event) {
  debug('install')
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', function (event) {
  debug('activate')
  event.waitUntil(Promise.all([
    self.clients.claim(),
    checkForUpdate()
  ]))
})

self.addEventListener('message', function (event) {
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
