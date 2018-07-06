/* eslint-env worker, serviceworker */

import './fetch/'
import './install/'
const debug = require('./lib/debug')(__filename)

debug('start')
