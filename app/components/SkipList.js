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
  componentDidMount() {
    this.reiterate()
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
    while (curr.v.next/* && arr.length < 10*/) { // only first 10
      // curr.next is a buffer of many bytes, only get the first 20
      var next = curr.v.next.slice(0, 20)
      curr = JSONB.parse(localStorage[next.toString('hex')])
      if (curr.v.t) {
        var d = new Date(0)
        d.setUTCMinutes(curr.v.d.readUIntBE(0, curr.v.d.length))
        arr.push(curr.v.t.toString('utf-8') + ' - ' + d)
      } else if (curr.v.f) { // follow
        var followerFeed = localStorage[curr.v.f.toString('hex')]
        if (followerFeed) {
          var followerCurr = JSONB.parse(followerFeed) // follower head
          while (followerCurr.v.next) {
            var n = followerCurr.v.next.slice(0, 20)
            followerCurr = JSONB.parse(localStorage[n.toString('hex')])
            if (followerCurr.v.t)
              arr.push(followerCurr.v.t.toString('utf-8') +' by '+ curr.v.f.toString('hex'))
          }
        }
        arr.push('following ' + curr.v.f.toString('hex'))
      }
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
        {this.state.tweets.map(function(tweet) {
          return <div className="tweet" key={tweet}>{tweet}</div>
        })}
      </div>
    );
  }
}
