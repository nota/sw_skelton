import {setItem, getItem} from './simple-indexdb'

export function setVersion (value) {
  return setItem('version', 'version', value)
}

export function getVersion () {
  return getItem('version', 'version').then(function (result) {
    if (!result) return undefined
    return result.value
  })
}
