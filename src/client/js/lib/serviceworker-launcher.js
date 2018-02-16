/* eslint-env browser */
const debug = require('./debug')(__filename)

const NOT_AVAILABLE = 'Your browser does not support service worker'

export default new class ServiceWorkerLauncher {
  getRegistration () {
    const {serviceWorker} = navigator
    return serviceWorker && serviceWorker.getRegistration('/')
  }

  async start () {
    const enabled = await this.getRegistration()
    if (enabled) this.register()
  }

  async register () {
    debug('register')

    const {serviceWorker} = navigator
    if (!serviceWorker) return alert(NOT_AVAILABLE)
    const reg = await serviceWorker.register('/serviceworker.js', {scope: '/'})

    return new Promise((resolve, reject) => {
      const state = (() => {
        if (reg.installing) return 'installing'
        if (reg.waiting) return 'waiting'
        if (reg.active) return 'active'
        return 'unknown'
      })()
      debug('registered', state)
      if (state === 'active') return resolve()

      reg.addEventListener('updatefound', (event) => {
        debug('new service worker is found')
        if (!reg.installing) return debug('not installing')
        debug('installing')
        // install中の新しいservice workerの状態を監視する
        reg.installing.addEventListener('statechange', (event) => {
          const state = event.target.state
          debug('statechange', state)
          // serviceWorker.readyは、activating後にresolveしてしまうので、問題がある
          if (state === 'activated') resolve()
        })
      })
    })
  }

  async unregister () {
    const keys = await caches.keys()
    await Promise.all(keys.map(key => caches.delete(key)))
    const reg = await this.getRegistration()
    if (reg) {
      const result = await reg.unregister()
      if (!result) throw new Error('Can not unregister the service worker')
    }
  }

  evacuate() {
    // XXX: このコードは、もしもメインのJSでバージョンアップシステムが動作しなかった場合の救済コードである
    setTimeout(function () {
      if (window.checkVersionDone) return
      alert('Auto updating system seems not working.')
      if (!confirm('Please reload the browser')) return
      window.location.reload()
    }, 10000)
  }
}()
