// baba()
import 'babel-polyfill'
import React from 'react'
import {render} from 'react-dom'

import ServiceWorker from './lib/register-serviceworker'

ServiceWorker.register()

import App from './components/app'

const appContainer = document.getElementById('app-container')
if (appContainer) {
  render((<App />), appContainer)
}
