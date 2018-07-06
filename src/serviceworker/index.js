/* eslint-env worker, serviceworker */

import './fetch'
import {checkForUpdate} from './caches'

const isDebug = () => location && ['localhost', 'sw-skelton.herokuapp.com'].includes(location.hostname)
const debug = (...msg) => isDebug() && console.log('%cserviceworker', 'color: gray', ...msg)

debug('start')

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
