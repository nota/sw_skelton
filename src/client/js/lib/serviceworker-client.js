/* eslint-env browser */
const debug = require('./debug')(__filename)

const NOT_AVAILABLE = 'Your browser does not support service worker'

export default new class ServiceWorkerClient {
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
      return this.postMessage('checkForUpdate')
    })
  }

  async enable () {
    debug('enable')

    const {serviceWorker} = navigator
    if (!serviceWorker) throw new Error(NOT_AVAILABLE)
    const reg = await serviceWorker.register('/serviceworker.js', {scope: '/'})
  }

  async disable () {
    debug('disable')
    const reg = await this.getRegistration()
    if (!reg) return

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

  async postMessage (message) {
    const reg = await this.getRegistration()
    if (!reg.active) throw new Error('Service worker is not active yet')
    reg.active.postMessage(message)
  }
}()
