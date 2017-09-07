// baba()
import 'babel-polyfill'
import React from 'react'
import {render} from 'react-dom'

import {registerServiceWorker} from './lib/register-serviceworker'

registerServiceWorker()

import App from './components/app'

const appContainer = document.getElementById('app-container')
if (appContainer) {
  render((<App />), appContainer)
}
