/* eslint-env browser */

import React, {Component} from 'react'

export default class Button extends Component {
//  static get propTypes () {
//    return {
//      children: PropTypes.node.isRequired
//    }
//  }

  constructor (props) {
    super(props)
    this.state = {
      focus: false
    }
    this.onWindowFocus = this.onWindowFocus.bind(this)
  }

  componentDidMount () {
    window.addEventListener('focus', this.onWindowFocus)
  }

  componentWillUnmount () {
    window.removeEventListener('focus', this.onWindowFocus)
  }

  onWindowFocus () {
    console.log('onWindowFocus')
    // XXX: windowFocusの直後にfocusがくることがあるのでキャッチする
    this.justFocused = true
    setTimeout(() => this.justFocused = false, 200)
  }

  onMouseDown (e) {
    console.log('onMouseDown')
    e.preventDefault()
    return
    this.isMouseDown = true
    const onMouseUp = (e) => {
      console.log('onMouseUp')
      this.isMouseDown = false
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mouseup', onMouseUp)
  }

  onFocus (e) {
    console.log('onFocus')
    if (this.justFocused) return e.preventDefault()
    if (this.isMouseDown || this.justFocused) return
//    this.setState({focus: true})
  }

  onBlur (e) {
    console.log('onBlur')
//    this.setState({focus: false})
  }

  render () {
    let className = this.props.className
    if (this.state.focus) className += ' focus'

    return (
      <button
        {...this.props}
        className={className}
        onMouseDown={this.onMouseDown.bind(this)}
        onFocus={this.onFocus.bind(this)}
        onBlur={this.onBlur.bind(this)}>
        {this.props.children}
      </button>
    )
  }
}
