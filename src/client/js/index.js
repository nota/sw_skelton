/* eslint-env browser */

import 'babel-polyfill'
import React from 'react'
import {render} from 'react-dom'
import App from './components/app'
import {ServiceWorkerClient} from './lib/serviceworker-client'

ServiceWorkerClient.start()

const appContainer = document.getElementById('app-container')
if (appContainer) {
  render((<App />), appContainer)
}
