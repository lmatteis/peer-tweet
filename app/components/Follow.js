import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import Tweet from './Tweet'
import SkipList from './SkipList'

export default class Follow extends Component {
  constructor(props) {
    super(props)
    this.state = {
      follow: ''
    }
  }
  onFollowChange(e) {
    this.setState({ follow: e.target.value })
  }

  follow() {

  }

  render() {
    return (
      <div>
        <input type="text" onChange={::this.onFollowChange} />
        <button onClick={::this.follow}>Follow</button>
      </div>
    );
  }
}
