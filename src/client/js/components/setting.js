/* eslint-env browser */

// const debug = require('../lib/debug')(__filename)

import React, {Component} from 'react'
import AppCacheStore from '../stores/app-cache-store'
import ServiceWorkerClient from '../lib/serviceworker-client'

export default class Setting extends Component {
  constructor (props) {
    super(props)

    const state = this.initState()
    state.enabled = false

    this.state = state

    AppCacheStore.on('change', this.onAppCacheChanged.bind(this))
  }

  initState () {
    return {
      myVersion: AppCacheStore.myVersion,
      newerVersion: AppCacheStore.newerVersion,
      timeOfUpdateFound: AppCacheStore.timeOfUpdateFound,
      loading: false
    }
  }

  async componentDidMount () {
    const myVersion = AppCacheStore.myVersion
    this.setState({myVersion})
    this.checkEnabled()
  }

  async checkEnabled () {
    const enabled = await ServiceWorkerClient.getRegistration()
    this.setState({enabled})
  }

  async onAppCacheChanged () {
    this.setState(this.initState())
  }

  async checkForUpdate () {
    this.setState({loading: true})
    try {
      await AppCacheStore.checkForUpdate()
      this.setState({loading: false})
//      ServiceWorkerClient.update()
    } catch (err) {
      alert(err.toString())
    }
    this.setState(this.initState())
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
        <p>serviceWorker:
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
