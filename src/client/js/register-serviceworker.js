const debug = require('./debug')(__filename)

export default async function initialize () {
  debug('initialize')

  const serviceWorker = navigator.serviceWorker

  if (!serviceWorker) {
    return console.error('Service worker is not available')
  }

  try {
    const reg = await serviceWorker.register('/sw.js', {scope: '/'})

    // registration worked
    let status
    if (reg.installing) {
      status = 'installing'
    } else if (reg.waiting) {
      status = 'wating'
    } else if (reg.active) {
      status = 'active'
    } else {
      status = 'unknown'
    }
    debug(`registered. state is ${status}`)

    reg.addEventListener('updatefound', (event) => {
      debug('new service worker is found')

      if (!reg.installing) {
        debug('not installing')
        return
      }

      debug('installing')

      // install中の新しいservice workerの状態を監視する
      reg.installing.addEventListener('statechange', (event) => {
        debug(event.target.state)
      })
    })
  } catch(err) {
    console.error('Service worker registration failed with ', err)
  }
}

