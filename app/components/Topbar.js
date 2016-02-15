import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import SkipList from './SkipList'
import Tweet from './Tweet'

export default class Topbar extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div className="top-bar">
        {this.props.hashHex ? '@'+DhtStore.hashToBase58(this.props.hashHex) : 'Timeline'}
        <div className="compose ion-compose"></div>
        <Tweet onTweetOrFollow={this.props.onTweetOrFollow} />
      </div>
    );
  }
}
