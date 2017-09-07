const debug = require('./debug')(__filename)

import {setVersion} from '../lib/version'

export async function registerServiceWorker () {
  if (!isServiceWorkerEnabled()) return

  debug('register')

  const serviceWorker = navigator.serviceWorker

  if (!serviceWorker) {
    return console.error('Service worker is not available')
  }

  try {
    const reg = await serviceWorker.register('/serviceworker.js', {scope: '/'})
    // XXX: ここから下のコードはすべてdebugのためにある
    const state = (() => {
      if (reg.installing) return 'installing'
      if (reg.waiting) return 'wating'
      if (reg.active) return 'active'
      return 'unknown'
    })()
    debug('registered', state)

    reg.addEventListener('updatefound', (event) => {
      debug('new service worker is found')
      if (!reg.installing) return debug('not installing')
      debug('installing')
      // install中の新しいservice workerの状態を監視する
      reg.installing.addEventListener('statechange', (event) => {
        debug('statechange', event.target.state)
      })
    })
  } catch (err) {
    console.error('Service worker registration failed with ', err)
  }
}

export function isServiceWorkerEnabled () {
  return localStorage.enableServiceWorker === 'true'
}

export async function enableServiceWorker () {
  localStorage.enableServiceWorker = true
  await registerServiceWorker()
}

export async function disableServiceWorker () {
  localStorage.enableServiceWorker = false

  const serviceWorker = navigator.serviceWorker
  const reg = await serviceWorker.register('/serviceworker.js', {scope: '/'})
  await reg.unregister()
  await setVersion(null)
}

// 緊急用
window.disableServiceWorker = disableServiceWorker
