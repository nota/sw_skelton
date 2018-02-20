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
    if (!serviceWorker) throw new Error(NOT_AVAILABLE)
    const reg = await serviceWorker.register('/serviceworker.js', {scope: '/'})
    if (reg.active) this.postMessage('reactivate')
  }

  async disable () {
    debug('disable')
    const reg = await this.getRegistration()
    if (!reg) return

    this.postMessage('deactivate')
    const result = await reg.unregister()
    if (!result) throw new Error('Can not disable the service worker')
  }

  async update () {
    debug('update')
    const reg = await this.getRegistration()
    if (!reg) return
    reg.update() // service worker自体の更新を行う
    this.postMessage('checkForUpdate') // assets(app.html, JS, CSS, Image等)の更新を確認
  }

  postMessage (message) {
    const {controller} = navigator.serviceWorker
    if (!controller) throw new Error('Service worker controller is not available')
    controller.postMessage(message)
  }
}()
