import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import SkipList from './SkipList'
import Topbar from './Topbar'


export default class Address extends Component {
  constructor(props) {
    super(props)
    this.state = {
      date: Date.now()
    }
  }

  render() {
    return (
      <div>
        <Topbar hashHex={this.props.hashHex} onTweetOrFollow={() => this.setState({ date: Date.now() }) } />
        <div className="tweets">
          <SkipList hashHex={this.props.hashHex} key={this.state.date} />
        </div>
      </div>
    );
  }
}
