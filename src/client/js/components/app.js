import React, {Component} from 'react'
import Setting from './setting'
import UpdateNotifier from './update-notifier'

export default class App extends Component {
  render () {
    return (
      <div>
        <div className='navbar navbar-inverse'>
          <a className='navbar-brand' href='#'>Scrapbox</a>
        </div>
        <UpdateNotifier />
        <div className='container'>
          <h1>
            <img src='/img/logo.png' className='logoimg' width='50' />
            Hello, service worker
          </h1>
          <Setting />
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
      </div>
    )
  }
}
