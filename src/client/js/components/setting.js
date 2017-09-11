// const debug = require('../lib/debug')(__filename)

import React, {Component} from 'react'
import AppVersionStore from '../stores/app-version-store'
import ServiceWorker from '../lib/register-serviceworker'

export default class Setting extends Component {
  constructor (props) {
    super(props)

    this.state = {
      version: null,
      url: null,
      enabled: false
    }

    AppVersionStore.on('change', this.onAppVersionChanged.bind(this))
  }

  async componentDidMount () {
    const version = await AppVersionStore.version
    const url = window.location.href
    this.setState({version, url})
    this.checkEnabled()
  }

  async checkEnabled () {
    const registered = await ServiceWorker.getRegistration()
    const enabled = ServiceWorker.isEnabled() || registered
    this.setState({enabled})
  }

  async onAppVersionChanged () {
    const version = await AppVersionStore.version
    this.setState({version})
  }

  async checkUpdateAndPrompt () {
    await AppVersionStore.checkForUpdate()
  }

  async enableServiceWorker () {
    try {
      await ServiceWorker.enable()
    } catch (err) {
      alert('Cannot enable service worker\n' + err.message)
      throw (err)
      return
    }
    AppVersionStore.checkForUpdateAutomatically()
    this.checkEnabled()
  }

  async disableServiceWorker () {
    try {
      await ServiceWorker.disable()
    } catch (err) {
      alert('Cannot disable service worker\n' + err.message)
      throw (err)
      return
    }
    AppVersionStore.stop()
    this.checkEnabled()
  }

  render () {
    return (
      <div>
        <p>serviceWorker: {this.state.enabled ? 'on': 'off'}</p>
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
            this.state.enabled ?
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
