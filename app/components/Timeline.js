import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import SkipList from './SkipList'

export default class Timeline extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div>
        <div className="top-bar">
          @{DhtStore.hashToBase58(DhtStore.myHash())}
          <div className="compose ion-compose"></div>
        </div>
        <div className="tweets">
          <SkipList />
        </div>
      </div>
    );
  }
}
