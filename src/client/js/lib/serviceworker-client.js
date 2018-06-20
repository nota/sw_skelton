/* eslint-env browser */
const debug = require('./debug')(__filename)

const NOT_AVAILABLE = 'Your browser does not support service worker'

export const ServiceWorkerClient = {getRegistration, start, enable, disable, update, postMessage}

function getRegistration () {
  const {serviceWorker} = navigator
  return serviceWorker && serviceWorker.getRegistration('/')
}

async function start () {
  debug('start')
  const reg = await getRegistration()
  if (!reg) return
  enable()
}

async function enable () {
  debug('enable')

  const {serviceWorker} = navigator
  if (!serviceWorker) throw new Error(NOT_AVAILABLE)
  return serviceWorker.register('/serviceworker.js', {scope: '/'})
}

async function disable () {
  debug('disable')
  const reg = await getRegistration()
  if (!reg) return

  const result = await reg.unregister()
  if (!result) throw new Error('Can not disable the service worker')
}

async function update () {
  debug('update')
  const reg = await getRegistration()
  if (!reg) return
  return reg.update() // service worker自体の更新を行う
}

async function postMessage (message) {
  const reg = await getRegistration()
  if (!reg || !reg.active) throw new Error('Service worker is not active yet')
  // Note: postMessageが呼ばれると、service workerがstopしていてもstartされる
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel()
    channel.port1.onmessage = e => {
      if (e.data && e.data.error) {
        reject(e.data.error)
      } else {
        resolve(e.data)
      }
    }
    reg.active.postMessage(message, [channel.port2])
  })
}
