const debug = require('../debug')(__filename)

import React from 'react'
import {Component} from 'react'

import {checkForUpdate, updateNow} from '../check-update'
import {getVersion} from '../version'

export default class App extends Component {
  constructor (props) {
    super(props)

    this.state = {}
  }

  async componentDidMount () {
    const version = await getVersion()
    const url = window.location.href
    this.setState({version, url})
//    const message = `url: ${url}<br>local version: ${version}`
    // 定期的に新しいリソースがないか確認しにいく
    setInterval(this.checkUpdateAndPrompt.bind(this), 10 * 1000)
    this.checkUpdateAndPrompt()
  }

  async checkUpdateAndPrompt () {
    const updated = await checkForUpdate()
    if  (!updated) return

    this.setState({updateFound: true})
  }

  onClickUpdate () {
    updateNow()
  }

  render () {
    return (
      <div className={this.state.updateFound ? 'update-found' : ''}>
        {
          this.state.updateFound && (
            <div className='update-alert-bar' onClick={this.onClickUpdate}>
              <a>
                新しいバージョンが見つかりました。ここを押してアップデートしましょう。
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
          <button className='btn btn-default'>
            Check for update
          </button>
          &nbsp;
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
