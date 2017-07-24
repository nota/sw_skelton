import request from 'superagent'

// Clientアセットに変化がないかリモートにリクエストして確認する。
// 利用中に、アプリの更新をpush通知などを受け取って、
// 発火するようにすると、次のリロード時には
// 新機能が早速使えるようになるので良さそうだ。
// リロードを2回しなくて良くなるのが利点だ。
async function checkForUpdate () {
  console.log('checkForUpdate')
  const response = await request.get('/api/client_version')
  console.log(response)
  console.log(response.body.version)

//          document.getElementById('message').innerHTML = 'there is a new update!'
//          var reloadButton = document.getElementById('reload_btn')
//          reloadButton.style.display = 'inline-block'
          // 自動でリロードをかける
          // 不要ならコメントアウト
//          if (shouldReloadImmediately) {
//            setTimeout(function () {
//              window.location.reload()
//            }, 300)
//          }


/*
  shouldReloadImmediately = false
  console.log('Checking for update...')
  navigator.serviceWorker.getRegistration('/').then(function (reg) {
    return reg.update()
  }).then(function () {
    console.log('Checking for update... done')
  })
*/
}

// 定期的に新しいリソースがないか確認しにいく
setInterval(function () {
  checkForUpdate()
}, 10 * 1000)

window.onload = function onLoad () {
  console.log('Window has been loaded')
  const url = window.location.href

  document.getElementById('message').innerHTML = url

  const checkForUpdateButton = document.getElementById('check_for_update_btn')
  const reloadButton = document.getElementById('reload_btn')

  checkForUpdateButton.onclick = function () {
    checkForUpdate()
  }

  reloadButton.style.display = 'none'
  reloadButton.onclick = function () {
    console.log('relaod now')
    window.location.reload()
  }
}
