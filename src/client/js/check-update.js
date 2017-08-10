const debug = require('./debug')(__filename)

import request from 'superagent'
import {setVersion, getVersion} from './version'

// Clientアセットに変化がないかリモートにリクエストして確認する。
// 利用中に、アプリの更新をpush通知などを受け取って、
// 発火するようにすると、次のリロード時には
// 新機能が早速使えるようになるので良さそうだ。
// リロードを2回しなくて良くなるのが利点だ。

let _newVersion

async function checkForUpdate () {
  debug('checkForUpdate')
  const response = await request.get('/api/client_version')
  //console.log(response)
  debug(response.body.version)

  const newVersion = response.body.version
  _newVersion = newVersion

  const currentVersion = await getVersion()

  if (newVersion != currentVersion) {
    document.getElementById('update_message').innerHTML = 'there is a new update!'
    const updateAlert = document.getElementById('new_update_alert')
    updateAlert.style.display = 'inline-block'
  }
}

async function updateNow () {
  debug('Update now')
  await setVersion(_newVersion)
  window.location.reload()
}

// 定期的に新しいリソースがないか確認しにいく
setInterval(() => { checkForUpdate() }, 10 * 1000)

window.onload = async function onLoad () {
  debug('Window has been loaded')
  const url = window.location.href

  const version = await getVersion()

  const message = `url: ${url}<br>version: ${version}`

  document.getElementById('message').innerHTML = message

  const checkForUpdateButton = document.getElementById('check_for_update_btn')
  const updateButton = document.getElementById('update_btn')

  checkForUpdateButton.onclick = () => { checkForUpdate() }
  updateButton.onclick = () => { updateNow() }

  checkForUpdate()
}
