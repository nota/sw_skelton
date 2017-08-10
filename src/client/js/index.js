import 'babel-polyfill'

import registerServiceworker from './register-serviceworker'
require('./setup-ui')

registerServiceworker()
