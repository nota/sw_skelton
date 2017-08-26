import 'babel-polyfill'
import React from 'react'
import {render} from 'react-dom'

import registerServiceworker from './lib/register-serviceworker'

registerServiceworker()

import App from './components/app'

const appContainer = document.getElementById('app-container')
if (appContainer) {
  render((<App />), appContainer)
}
