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
  publishRecursion(curr) {

    dht.put(curr, (err, res) => {
      if (err) return console.error(err);
      console.log('published', res)

      if (!curr || !curr.v.next) {
        console.log('publishing finished')
        return;
      }

      var next = curr.v.next.slice(0, 20)
      curr = JSONB.parse(localStorage[next.toString('hex')])
      console.log('now publishing', curr)
      this.publishRecursion(curr)

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
    this.publishRecursion(curr)

  }

  render() {
    return (
      <div>
        <button onClick={::this.publish}>publish</button>
        <div>
        </div>
      </div>
    );
  }
}
