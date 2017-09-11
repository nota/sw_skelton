const debug = require('./debug')(__filename)
import request from 'superagent'

const NOT_AVAILABLE = 'Your browser does not support service worker'

export default new class ServiceWorker {
  async register () {
    if (!this.isEnabled()) return

    debug('register')

    const {serviceWorker} = navigator
    if (!serviceWorker) return alert(NOT_AVAILABLE)
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
  }

  isEnabled () {
    return localStorage.enableServiceWorker === 'true'
  }

  getRegistration () {
    const {serviceWorker} = navigator
    if (!serviceWorker) return null
    return serviceWorker.getRegistration('/')
  }

  async enable () {
    if (!navigator.serviceWorker) return alert(NOT_AVAILABLE)

    localStorage.enableServiceWorker = true
    await this.register()
  }

  async disable () {
    localStorage.enableServiceWorker = false

    try {
      await request.get('/api/caches/clear')
    } catch (err) {
      if (err.status !== 404) console.error(err)
    }
    const reg = await this.getRegistration()
    if (reg) await reg.unregister()
  }
}()
