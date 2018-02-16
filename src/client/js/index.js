/* eslint-env browser */

// baba()
import 'babel-polyfill'
import React from 'react'
import {render} from 'react-dom'

import ServiceWorkerLauncher from './lib/serviceworker-launcher'

ServiceWorkerLauncher.start()

import App from './components/app'

const appContainer = document.getElementById('app-container')
if (appContainer) {
  render((<App />), appContainer)
}
