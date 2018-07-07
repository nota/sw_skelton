/* eslint-env browser */

import React, {Component} from 'react'
import AssetsCacheStore from '../stores/assets-cache-store'
import {ServiceWorkerClient} from '../lib/serviceworker-client'
const debug = require('../lib/debug')(__filename)

export default class Setting extends Component {
  constructor (props) {
    super(props)

    const state = this.getStateFromStore()
    state.enabled = false

    this.state = state

    AssetsCacheStore.on('change', this.onStoreChanged.bind(this))
  }

  getStateFromStore () {
    return {
      version: AssetsCacheStore.version,
      hasCache: AssetsCacheStore.hasCache(),
      newVersion: AssetsCacheStore.newVersion,
      loading: false
    }
  }

  async componentDidMount () {
    this.setState(this.getStateFromStore())
    this.checkEnabled()
  }

  async checkEnabled () {
    const enabled = await ServiceWorkerClient.getRegistration()
    this.setState({enabled})
  }

  async onStoreChanged () {
    this.setState(this.getStateFromStore())
  }

  async checkForUpdate () {
    if (!navigator.onLine) {
      alert('Your network is offline. Try again later.')
      return
    }

    this.setState({loading: true})
    try {
      const res = await ServiceWorkerClient.postMessage({name: 'checkForUpdate'})
      debug(res)
      // await AssetsCacheStore.checkForUpdate()
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
  }

  async disableServiceWorker () {
    try {
      await ServiceWorkerClient.disable()
    } catch (err) {
      alert('Cannot disable service worker\n' + err.toString())
      throw (err)
    }
    const keys = await caches.keys()
    await Promise.all(keys.map(key => caches.delete(key)))

    this.setState({closeMessage: 'service worker stops after all the tabs have been closed'})
    this.checkEnabled()
  }

  render () {
    const {version, newVersion, hasCache, enabled, loading, closeMessage} = this.state

    return (
      <div>
        <p><b>assets</b></p>
        <p>
          version: {version}
          {
            hasCache && ' (saved)'
          }
        </p>
        {
          newVersion &&
            <p>
              new version ({newVersion}) is ready! (saved)
            </p>
        }
        {
          !newVersion && hasCache &&
            <p>It’s up to date</p>
        }
        {
          !newVersion && !hasCache &&
            <p>-</p>
        }
        <p>
          <button className='btn btn-default' onClick={this.checkForUpdate.bind(this)} disabled={!enabled}>
            { loading ? 'Checking...' : 'Check for update' }
          </button>
          &nbsp;
        </p>
        <hr />
        <p><b>service worker</b></p>
        <p>
          enabled:
          {
            enabled
              ? <span className='label label-success'>on</span>
              : <span className='label label-danger'>off</span>
          }
        </p>
        {
          closeMessage &&
            <p className='alert alert-danger'>
              {closeMessage}
            </p>
        }
        <p>
          {
            enabled
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
