// const debug = require('../lib/debug')(__filename)

import React, {Component} from 'react'
import AppVersionStore from '../stores/app-version-store'
import {enableServiceWorker, disableServiceWorker, isServiceWorkerEnabled} from '../lib/register-serviceworker'

export default class Setting extends Component {
  constructor (props) {
    super(props)

    this.state = {
      version: null,
      url: null
    }

    AppVersionStore.on('change', this.onAppVersionChanged.bind(this))
  }

  async componentDidMount () {
    const version = await AppVersionStore.currentVersion()
    const url = window.location.href
    this.setState({version, url})
  }

  async onAppVersionChanged () {
    const version = await AppVersionStore.currentVersion()
    this.setState({version})
  }

  async checkUpdateAndPrompt () {
    await AppVersionStore.checkForUpdate()
  }

  async enableServiceWorker () {
    await enableServiceWorker()
    alert('successfully enabled')
    AppVersionStore.checkForUpdateAutomatically()
  }

  async disableServiceWorker () {
    await disableServiceWorker()
    AppVersionStore.stop()
    const result = confirm ('successfully disabled. Will yor reload?')
    if (result) location.reload()
  }

  render () {
    return (
      <div>
        {
          this.state.version && (
            <p>
              url: {this.state.url}<br />
              local version: {this.state.version}
            </p>
          )
        }
        <p>
          <button className='btn btn-default' onClick={this.checkUpdateAndPrompt.bind(this)}>
            Check for update
          </button>
          &nbsp;
        </p>
        <p>
          {
            isServiceWorkerEnabled() ?
              <button className='btn btn-default btn-sm' onClick={this.disableServiceWorker.bind(this)}>
                Disable service worker
              </button> :
              <button className='btn btn-default btn-sm' onClick={this.enableServiceWorker.bind(this)}>
                Enable service worker
              </button>
          }
        </p>
      </div>
    )
  }
}
