import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import Tweet from './Tweet'
import SkipList from './SkipList'

export default class Main extends Component {
  constructor(props) {
    super(props)
    this.state = {
      tweets: []
    }
  }

  getTweet(hash) {
    dht.get(hash, (err, res) => {
      console.log('got tweet', res)
      // add tweet to state
      if (res)
        this.setState((state) => { tweets: state.tweets.push(res.v.t.toString('utf-8')) })

      if (res && res.v.next)
        this.getTweet(res.v.next)

    })
  }

  reiterate(e) {
    this.setState({ tweets: [] })
    // start from getting head
    dht.get(DhtStore.myHash(), (err, res) => {
      console.log('got head', res)

      if (res)
        this.setState((state) => { tweets: state.tweets.push(res.v.n.toString('utf-8')) })
      // now we get the next hash!
      if (res && res.v.next) {
        this.getTweet(res.v.next)
      }

    })
  }

  render() {
    return (
      <div>
        <button onClick={::this.reiterate}>reiterate</button>
        <div>
          {this.state.tweets.map(function(tweet) {
            return <div key={tweet}>{tweet}</div>
          })}
        </div>
      </div>
    );
  }
}
