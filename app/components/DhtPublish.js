import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import Tweet from './Tweet'
import SkipList from './SkipList'

export default class DhtPublish extends Component {
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
  publishRecursion(curr, isMyFeed) {

    dht.put(curr, (err, res) => {
      if (err) return console.error(err);
      console.log('published', res)

      if (!curr || !curr.v.next) {
        console.log('publishing finished')
        return;
      }

      var next = curr.v.next.slice(0, 20)
      curr = JSONB.parse(localStorage[next.toString('hex')])

      if (curr.v.f && isMyFeed) { // we have a follow hash! branch out!
        var followerCurr = JSONB.parse(localStorage[curr.v.f.toString('hex')])
        console.log('have a follower. branching out publishing', followerCurr.toString('hex'))
        this.publishRecursion(followerCurr, false)
        //this.downloadRecursion(curr.v.f.toString('hex'), false, true)
      }

      console.log('now publishing', next.toString('hex'))
      this.publishRecursion(curr, isMyFeed)

    })
  }

  publish(e) {
    // start from getting head
    var myHash = DhtStore.myHash()
    var myFeed = localStorage[myHash]

    if (!myFeed) {
      console.log('head not in localStorage')
      return;
    }

    var head = JSONB.parse(myFeed)
    // need to merge this with our default key sign stuff
    head.sign = opts.sign;


    // i guess we can start publishing head
    console.log('starting to publish head')
    var curr = head
    this.publishRecursion(curr, true)

  }

  render() {
    return (
      <div>
        // this publishes to the DHT, starting from my hash in localStorage
        <br />
        <button onClick={::this.publish}>publish</button>
        <div>
        </div>
      </div>
    );
  }
}
