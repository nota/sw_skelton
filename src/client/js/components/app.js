// const debug = require('../lib/debug')(__filename)

import React, {Component} from 'react'
import AppVersionStore from '../stores/app-version-store'
import {enableServiceWorker, disableServiceWorker, isServiceWorkerEnabled} from '../lib/register-serviceworker'

export default class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      hasUpdate: AppVersionStore.hasUpdate
    }

    this.onAssetCacheChanged = this.onAssetCacheChanged.bind(this)
    AppVersionStore.on('change', this.onAssetCacheChanged)
  }

  async componentDidMount () {
    const version = await AppVersionStore.currentVersion()
    const url = window.location.href
    this.setState({version, url})

    if (isServiceWorkerEnabled()) {
      AppVersionStore.checkForUpdateAutomatically()
    }
  }

  onAssetCacheChanged () {
    this.setState({hasUpdate: true})
  }

  async checkUpdateAndPrompt () {
    await AppVersionStore.checkForUpdate()
  }

  onClickUpdate () {
    window.location.reload()
  }

  async enableServiceWorker () {
    await enableServiceWorker()
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
      <div className={this.state.hasUpdate ? 'update-found' : ''}>
        {
          this.state.hasUpdate && (
            <div className='update-alert-bar' onClick={this.onClickUpdate}>
              <a>
                Scrapboxが更新されました。再読込しますか？
              </a>
            </div>
          )
        }
        <h1>
          <img src='/img/logo.png' width='50' />
          Hello, service worker
        </h1>
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

        <div className='text'>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          sed do eiusmod tempor incididunt ut labore et dolore magna
          aliqua.
          Ut enim ad minim veniam, quis nostrud exercitation ullamco
          laboris nisi ut aliquip ex ea commodo consequat.
          Duis aute irure dolor in reprehenderit in voluptate velit
          esse cillum dolore eu fugiat nulla pariatur.
          Excepteur sint occaecat cupidatat non proident,
          sunt in culpa qui officia deserunt mollit anim id est laborum.
        </div>
      </div>
    )
  }
}
