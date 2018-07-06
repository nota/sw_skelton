/* eslint-env worker, serviceworker */

const enable = location && ['localhost', 'sw-skelton.herokuapp.com'].includes(location.hostname)

const PATH_HEADS = [
  '/src/serviceworker'
]

function fileToName (filename) {
  if (typeof filename !== 'string') throw new Error('filename is not string')
  return filename
    .replace(new RegExp('^(' + PATH_HEADS.join('|') + ')'), '')
    .replace(/\..+$/, '') // file-ext
    .replace(/\/index$/, '') // 末尾index.jsは省略
    .replace(/\//g, ':')
}

module.exports = function createDebug (filename) {
  if (!enable) return () => { }
  const title = 'serviceworker' + fileToName(filename)
  return function (...msg) {
    console.log(`%c${title}`, 'color: gray', ...msg)
  }
}
