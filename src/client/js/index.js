/* eslint-env browser */

// baba()
import 'babel-polyfill'
import React from 'react'
import {render} from 'react-dom'

import ServiceWorker from './lib/serviceworker-utils'

ServiceWorker.start()

import App from './components/app'

const appContainer = document.getElementById('app-container')
if (appContainer) {
  render((<App />), appContainer)
}

// XXX: このコードは、もしもメインのJSでバージョンアップシステムが動作しなかった場合の救済コードである
const wasServiceWorkerEnalbed = localStorage.serviceWorker === 'true'

setTimeout(function () {
  if (!wasServiceWorkerEnalbed) return
  const serviceWorker = navigator.serviceWorker
  if (window.checkVersionDone || !serviceWorker) return
  alert('Auto updating system seems not working.')
  ServiceWorker.disable().then(() => {
    if (!confirm('Please reload the browser')) return
    window.location.reload()
  })
}, 10000)
