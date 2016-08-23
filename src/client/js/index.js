console.log('hello')

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (reg) {
    // registration worked
    console.log('registration succeeded', reg)

    var hasExistingActiveWorker = !!reg.active

    reg.addEventListener('updatefound', function (event) {
      // A new worker is coming!!!!
      console.log('a new worker is coming!', reg)

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
        console.log('state change!', event.target)
        if (event.target.state === 'activated') {
          document.getElementById('message').innerHTML = 'there is a new update!'
          var updateButton = document.getElementById('update_btn')
          updateButton.style.display = 'inline-block'
          // 自動でリロードをかける
          // 不要ならコメントアウト
          // window.location.reload()
        }
      })
    })
  }).catch(function (error) {
    // registration failed
    console.error('registration failed with ' + error)
  })
}

window.onload = function onLoad () {
  console.log('window has been loaded')
  var url = window.location.href

  document.getElementById('message').innerHTML = url

  var checkForUpdateButton = document.getElementById('check_for_update_btn')
  var updateButton = document.getElementById('update_btn')

  checkForUpdateButton.onclick = function () {
    // reg.updateはservice workerをアップデートする。
    // もしworkerに変化があれば、updatefoundが呼ばれる。
    // なけれb何も起きない
    // 利用中に、アプリの更新をpush通知などを受け取って、
    // 発火するようにすると、次のリロード時には
    // 新機能が早速使えるようになるので良さそうだ。
    // リロードを2回しなくて良くなるのが利点だ。
    console.log('checking for update...')
    navigator.serviceWorker.getRegistration('/').then(function (reg) {
      reg.update().then(function () {
        console.log('checking for update... done')
      })
    })
  }

  updateButton.style.display = 'none'
  updateButton.onclick = function () {
    // reg.updateはservice workerをアップデートする。
    // もしworkerに変化があれば、updatefoundが呼ばれる。
    // なけれb何も起きない
    // 利用中に、アプリの更新をpush通知などを受け取って、
    // 発火するようにすると、次のリロード時には
    // 新機能が早速使えるようになるので良さそうだ。
    // リロードを2回しなくて良くなるのが利点だ。
    console.log('update!')
    window.location.reload()
  }
}
