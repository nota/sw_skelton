const debug = require('./debug')(__filename)

import {setVersion} from '../lib/version'

export async function registerServiceworker () {
  if (!isServicewokerEnabled()) return

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

export function isServicewokerEnabled () {
  return localStorage.useServiceworker === 'true'
}

export async function enableServiceworker () {
  localStorage.useServiceworker = true
  await registerServiceworker()
}

export async function disableServiceworker () {
  localStorage.useServiceworker = false

  const serviceWorker = navigator.serviceWorker
  const reg = await serviceWorker.register('/serviceworker.js', {scope: '/'})
  await reg.unregister()
  await setVersion(null)
}

// 緊急用
window.disableServiceworker = disableServiceworker
