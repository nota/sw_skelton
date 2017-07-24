import 'babel-polyfill'

import registerServiceworker from './register-serviceworker'
require('./check-update')

registerServiceworker()
