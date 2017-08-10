const debug = require('./debug')(__filename)

import request from 'superagent'
import {setVersion, getVersion} from './version'

// Clientアセットに変化がないかリモートにリクエストして確認する。
// 利用中に、アプリの更新をpush通知などを受け取って、
// 発火するようにすると、次のリロード時には
// 新機能が早速使えるようになるので良さそうだ。
// リロードを2回しなくて良くなるのが利点だ。

let _newVersion

export async function checkForUpdate () {
  debug('fething...')
  let response
  try {
    response = await request.get('/api/client_version')
  } catch (err) {
    console.warn('Can not fetch the lastest version')
    return
  }
  debug(`fetched: ${response.body.version}`)

  const newVersion = response.body.version
  _newVersion = newVersion

  const currentVersion = await getVersion()
  debug(`currrent version: ${currentVersion}`)

  if (!currentVersion) {
    debug('write version to DB')
    await setVersion(_newVersion)
    return false
  }

  return (newVersion != currentVersion)
}

export async function updateNow () {
  await setVersion(_newVersion)
  window.location.reload()
}
