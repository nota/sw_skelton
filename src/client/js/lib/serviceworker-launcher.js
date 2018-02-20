/* eslint-env browser */
const debug = require('./debug')(__filename)

const NOT_AVAILABLE = 'Your browser does not support service worker'

export default new class ServiceWorkerLauncher {
  getRegistration () {
    const {serviceWorker} = navigator
    return serviceWorker && serviceWorker.getRegistration('/')
  }

  async start () {
    debug('start')
    const reg = await this.getRegistration()
    if (!reg) return
    this.enable()

    window.addEventListener('load', () => {
      debug('onload')
      this.postMessage('checkForUpdate')
    })
  }

  async enable () {
    debug('enable')

    const {serviceWorker} = navigator
    if (!serviceWorker) return alert(NOT_AVAILABLE)
    const reg = await serviceWorker.register('/serviceworker.js', {scope: '/'})
    if (reg.active) this.postMessage('reactivate')

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
          const {state} = event.target
          debug('statechange', state)
          // serviceWorker.readyは、activating後にresolveしてしまうので、問題がある
          if (state === 'activated') resolve()
        })
      })
    })
  }

  async disable () {
    debug('disable')
    const reg = await this.getRegistration()
    if (!reg) return

    this.postMessage('deactivate')
    const result = await reg.unregister()
    if (!result) throw new Error('Can not disable the service worker')
  }

  // 注意: この関数はservice worker自体の更新を行うもので、
  // assetの更新を行うものではない
  async update () {
    debug('update')
    const reg = await this.getRegistration()
    if (!reg) return
    reg.update()
  }

  postMessage (message) {
    const {controller} = navigator.serviceWorker
    if (!controller) throw new Error('Service worker controller is not available')
    controller.postMessage(message)
  }
}()
