/* eslint-env worker, serviceworker */

import './fetch/'
import './install/'

const isDebug = () => location && ['localhost', 'sw-skelton.herokuapp.com'].includes(location.hostname)
const debug = (...msg) => isDebug() && console.log('%cserviceworker', 'color: gray', ...msg)

debug('start')
