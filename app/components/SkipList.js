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
    var myHash = DhtStore.myHash()
    var myFeed = localStorage[myHash]

    if (!myFeed) return;

    var head = JSONB.parse(myFeed)

    var arr = []
    var curr = head
    while (curr.v.next && arr.length < 10) { // only first 10
      // curr.next is a buffer of many bytes, only get the first 20
      var next = curr.v.next.slice(0, 20)
      curr = JSONB.parse(localStorage[next.toString('hex')])
      if (curr.v.t)
        arr.push(curr.v.t.toString('utf-8'))
      else if (curr.v.f) // follow
        arr.push('following ' + curr.v.f.toString('hex'))
    }
    this.setState({ tweets : arr })

    /*
    dht.get(DhtStore.myHash(), (err, res) => {
      console.log('got head', res)

      if (res)
      // now we get the next hash!
      if (res && res.v.next) {
        this.getTweet(res.v.next)
      }

    })
    */
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
