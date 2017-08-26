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
  const currentVersion = await getVersion()
  debug('checking...')
  let response
  try {
    response = await request.get('/api/client_version')
  } catch (err) {
    console.warn('Can not fetch the latest version')
    return
  }
  const newVersion = response.body.version
  _newVersion = newVersion

  const isUpdateFound = (newVersion != currentVersion)
  if (isUpdateFound)
    debug('new updated is found', newVersion, 'current:', currentVersion)
  else
    debug('no update', newVersion, 'current:', currentVersion)

  if (!currentVersion) {
    debug('save initial version in DB')
    await setVersion(_newVersion)
    return false
  }

  return isUpdateFound
}

export async function updateNow () {
  debug('update now')
  await setVersion(_newVersion)
  window.location.reload()
}
