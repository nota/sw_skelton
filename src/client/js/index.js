console.log('Hello by index.js')

var shouldReloadImmediately = true

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (reg) {
    // registration worked

    var status
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

    var hasExistingActiveWorker = !!reg.active

    reg.addEventListener('updatefound', function (event) {
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
      reg.installing.addEventListener('statechange', function (event) {
        console.log('Service worker state changed', event.target)
        if (event.target.state === 'activated') {
          document.getElementById('message').innerHTML = 'there is a new update!'
          var reloadButton = document.getElementById('reload_btn')
          reloadButton.style.display = 'inline-block'
          // 自動でリロードをかける
          // 不要ならコメントアウト
          if (shouldReloadImmediately) {
            setTimeout(function () {
              window.location.reload()
            }, 300)
          }
        }
      })
    })
  }).catch(function (error) {
    // registration failed
    console.error('registration failed with ' + error)
  })
} else {
  console.log('Service worker is not available')
}

// Service workerに変化がないかリモートにリクエストして確認する。
// reg.updateはservice workerをアップデートする。
// もしworkerに変化があれば、updatefoundが呼ばれる。
// なければ何も起きない。
// 利用中に、アプリの更新をpush通知などを受け取って、
// 発火するようにすると、次のリロード時には
// 新機能が早速使えるようになるので良さそうだ。
// リロードを2回しなくて良くなるのが利点だ。
function checkForUpdate () {
  shouldReloadImmediately = false
  console.log('Checking for update...')
  navigator.serviceWorker.getRegistration('/').then(function (reg) {
    return reg.update()
  }).then(function () {
    console.log('Checking for update... done')
  })
}

window.onload = function onLoad () {
  console.log('Window has been loaded')
  var url = window.location.href

  document.getElementById('message').innerHTML = url

  var checkForUpdateButton = document.getElementById('check_for_update_btn')
  var reloadButton = document.getElementById('reload_btn')

  checkForUpdateButton.onclick = function () {
    checkForUpdate()
  }

  reloadButton.style.display = 'none'
  reloadButton.onclick = function () {
    console.log('relaod now')
    window.location.reload()
  }
}

