import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import Tweet from './Tweet'
import SkipList from './SkipList'

export default class DhtPublish extends Component {
  constructor(props) {
    super(props)
    this.props = props
    this.state = {
      stack: 0,
      tweets: []
    }

  }

  componentDidMount() {
    var run = () => {
      if (this.state.stack > 0) {
        console.log('still publishing')
        return;
      }
      this.publish()
    }

    this.intervalID = setInterval(run, this.props.every || 1800000) // 30 minutes = 1800000 ms

    dht.on('ready', () => {
      //run()
    })

  }

  componentWillUnmount() {
    this.intervalID && clearInterval(this.intervalID);
    this.intervalID = false;
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
      if (!res || err) {
        this.setState((state) => ({ stack: state.stack - 1 }))
        return console.error(err);
      }
      console.log('published', res)

      if (!curr || !curr.v.next) {
        this.setState((state) => ({ stack: state.stack - 1 }))
        if (this.state.stack == 0) {
          console.log('publishing finished')
        }
        return;
      }

      var next = curr.v.next.slice(0, 20)
      curr = JSONB.parse(localStorage[next.toString('hex')])

      if (curr.v.f && isMyFeed) { // we have a follow hash! branch out!
        var followerCurr = JSONB.parse(localStorage[curr.v.f.toString('hex')])
        console.log('have a follower. branching out publishing', curr.v.f.toString('hex'))
        this.setState((state) => ({ stack: state.stack + 1 }))
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
    // should .get() my head to see which is the current .seq
    head.sign = opts.sign;


    // i guess we can start publishing head
    console.log('starting to publish head', head)
    var curr = head
    this.setState((state) => ({ stack: state.stack + 1 }))
    this.publishRecursion(curr, true)

  }

  render() {
    // this publishes to the DHT, starting from my hash in localStorage
    return (
      <div className="sidebar-item ion-upload down" onClick={::this.publish} disabled={this.state.stack > 0} title="Publish to the DHT, starting from my feed">
        {this.state.stack}
      </div>
    );
  }
}
