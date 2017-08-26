const debug = require('./debug')(__filename)

import {checkForUpdate, updateNow} from './check-update'
import {getVersion} from './version'

window.onload = async function onLoad () {
  debug('window has been loaded')
  const url = window.location.href

  const version = await getVersion()

  const message = `url: ${url}<br>local version: ${version}`

  document.getElementById('message').innerHTML = message

  const checkForUpdateButton = document.getElementById('check_for_update_btn')
  const updateButton = document.getElementById('update_btn')

  checkForUpdateButton.onclick = (e) => {
    checkForUpdate()
    e.preventDefault()
  }
  updateButton.onclick = () => { updateNow() }

  checkUpdateAndPrompt()
}

async function checkUpdateAndPrompt () {
  const updated = await checkForUpdate()
  if  (!updated) return

  const updateAlert = document.getElementById('new_update_alert')
  updateAlert.style.display = 'block'
  const body = document.body
  body.className = 'update-found'
}

// 定期的に新しいリソースがないか確認しにいく
setInterval(() => { checkUpdateAndPrompt() }, 10 * 1000)
