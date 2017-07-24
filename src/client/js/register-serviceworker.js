console.log('Hello by index.js')

export default async function initialize () {

  if (!('serviceWorker' in navigator)) {
    return console.error('Service worker is not available')
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

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
    console.log('Service worker is registered:', status)

    let hasExistingActiveWorker = !!reg.active

    reg.addEventListener('updatefound', (event) => {
      // A new worker is coming!!
      console.log('New service worker is found', reg)

      if (!reg.installing) {
        console.log('not installing')
        return
      }

      console.log('installing', reg.installing)

      if (!hasExistingActiveWorker) {
        console.log('this is the first worker, so do not prompt')
        hasExistingActiveWorker = true
        return
      }

      // install中の新しいservice workerの状態を監視する
      reg.installing.addEventListener('statechange', (event) => {
        console.log('Service worker state changed', event.target)
        if (event.target.state === 'activated') {
          console.log('activeted!!')
        }
      })
    })
  } catch(err) {
    // registration failed
    console.error('Serviceworker registration failed with ', err)
  }
}

