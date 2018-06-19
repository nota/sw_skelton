/* eslint-env browser */

const debug = require('../lib/debug')(__filename)

import React, {Component} from 'react'
import AssetsCacheStore from '../stores/assets-cache-store'
import ServiceWorkerClient from '../lib/serviceworker-client'

export default class Setting extends Component {
  constructor (props) {
    super(props)

    const state = this.initState()
    state.enabled = false

    this.state = state

    AssetsCacheStore.on('change', this.onStoreChanged.bind(this))
  }

  initState () {
    return {
      myVersion: AssetsCacheStore.myVersion,
      newerVersion: AssetsCacheStore.newerVersion,
      timeOfUpdateFound: AssetsCacheStore.timeOfUpdateFound,
      loading: false
    }
  }

  async componentDidMount () {
    const myVersion = AssetsCacheStore.myVersion
    this.setState({myVersion})
    this.checkEnabled()
  }

  async checkEnabled () {
    const enabled = await ServiceWorkerClient.getRegistration()
    this.setState({enabled})
  }

  async onStoreChanged () {
    this.setState(this.initState())
  }

  async checkForUpdate () {
    if (!navigator.onLine) {
      alert('Your network is offline. Try again later.')
      return
    }

    this.setState({loading: true})
    try {
      const res = await ServiceWorkerClient.postMessage('checkForUpdate')
      debug(res)
//      await AssetsCacheStore.checkForUpdate()
    } catch (err) {
      alert('Cannot check the new version\n' + err.toString())
    }
    this.setState({loading: false})
  }

  async enableServiceWorker () {
    try {
      await ServiceWorkerClient.enable()
    } catch (err) {
      alert('Cannot enable service worker\n' + err.toString())
      throw (err)
    }
    this.setState({closeMessage: null})
    this.checkEnabled()
    this.checkForUpdate()
  }

  async disableServiceWorker () {
    try {
      await ServiceWorkerClient.disable()
    } catch (err) {
      alert('Cannot disable service worker\n' + err.toString())
      throw (err)
    }
    this.setState({closeMessage: 'service worker stops after all the tabs have been closed'})
    this.setState({message: ''})
    this.checkEnabled()
  }

  render () {
    return (
      <div>
        <p><b>assets</b></p>
        {
          this.state.message && (
            <p>
              <b>{this.state.message}</b>
            </p>
          )
        }
        {
          this.state.timeOfUpdateFound && (
            <p>
              Update is downloaded: {this.state.timeOfUpdateFound.toString()}
            </p>
          )
        }
        <p>
          my version: {this.state.myVersion}
        </p>
        <p>
          new version: {this.state.newerVersion ? this.state.newerVersion + ' is available (cached)' : 'not available'}
        </p>
        <p>
          <button className='btn btn-default' onClick={this.checkForUpdate.bind(this)} disabled={!this.state.enabled}>
            { this.state.loading ? 'Checking...' : 'Check for update' }
          </button>
          &nbsp;
        </p>
        <hr />
        <p><b>service worker</b></p>
        <p>enabled:
          {
            this.state.enabled
              ? <span className='label label-success'>on</span>
              : <span className='label label-danger'>off</span>
          }
        </p>
        {
          this.state.closeMessage &&
            <p className='alert alert-danger'>
              {this.state.closeMessage}
            </p>
        }

        <p>
          {
            this.state.enabled
            ? <button className='btn btn-default' onClick={this.disableServiceWorker.bind(this)}>
                Disable service worker
            </button>
            : <button className='btn btn-default' onClick={this.enableServiceWorker.bind(this)}>
                Enable service worker
            </button>
          }
        </p>
      </div>
    )
  }
}
