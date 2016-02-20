import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import SkipList from './SkipList'
import Tweet from './Tweet'
import DhtSkipList from './DhtSkipList'
import { tweetsStore } from '../stores'


export default class Topbar extends Component {
  constructor(props) {
    super(props)
    this.state = {
      view: 'main'
    }
  }

  render() {
    var title;
    if (this.state.view == 'tweet') {
      title = <Tweet onTweetOrFollow={this.props.onTweetOrFollow} />
    } else if (this.state.view == 'search') {
      title = <DhtSkipList />
    } else {
      title = this.props.title || (this.props.hashHex ? '@'+DhtStore.hashToBase58(this.props.hashHex) : 'Timeline')
    }
    return (
      <div className="top-bar">
        <div className="compose ion-compose" onClick={() => this.setState({ view: 'tweet' })}></div>
        <div className="search ion-search" onClick={() => this.setState({ view: 'search' })}></div>

        {title}
      </div>
    );
  }
}
