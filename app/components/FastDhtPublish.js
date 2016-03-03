import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import Tweet from './Tweet'
import SkipList from './SkipList'

export default class FastDhtPublish extends Component {
  constructor(props) {
    super(props)
    this.props = props
    this.state = {
      stack: 0,
      timeOfLastRun: Date.now(),
      tweets: []
    }

    this.limit = 11 // this is the top number of items per feed that we want to republish
                    // 11 because it's top 10 + head

    this.chunkSize = 10 // we can't .put() more than 11 at the same time, so this helps
    this.stack = 0

  }

  componentDidMount() {
    var run = () => {
      if (this.state.stack > 0) {
        console.log('still publishing')
        return;
      }
      this.setState({ timeOfLastRun: Date.now() })
      this.publish()
    }
    var setTimeRemaining = () => {
      var now = Date.now()
      var t = this.props.every - (Date.now() - this.state.timeOfLastRun)
      if (t < 0) t = 0
      var seconds = Math.floor( (t/1000) % 60 );
      var minutes = Math.floor( (t/1000/60) % 60 );

      this.setState({ timeRemaining: this.state.timeOfLastRun ?
        minutes
        //('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2)
        : null})
    }

    this.intervalID = setInterval(run, this.props.every || 1800000) // 30 minutes = 1800000 ms
    this.updateTimeIntervalID = setInterval(setTimeRemaining, 60000) // every minute
    setTimeRemaining()

    // dht.on('ready', () => {
    //   //run()
    // })

  }

  componentWillUnmount() {
    this.intervalID && clearInterval(this.intervalID);
    this.intervalID = false;

    this.updateTimeIntervalID && clearInterval(this.updateTimeIntervalID);
    this.updateTimeIntervalID = false;
  }

  publishInChunks(toPublish, from, to) {

    for (var i=from; i<to; i++) {
      var curr = toPublish[i]
      if (!curr) {
        // we finished publishing!
        console.log('finished publishing fast!')
        break;
      }

      console.log('publishing', curr)
      this.stack += 1
      dht.put(curr, (err, res) => {
        if (err) console.error(err)
        this.stack -= 1

        this.setState((state) => ({ stack: state.stack - 1 }))

        if (this.stack == 0) { // finished this chunk, go to next
          console.log('starting to publish other chunk', from + this.chunkSize, to + this.chunkSize)
          this.publishInChunks(toPublish, from + this.chunkSize, to + this.chunkSize)
        }
      })
    }

  }


  publish(e) {

    // start from getting head
    var myHash = DhtStore.myHash()
    var myHead = localStorage[myHash]

    if (!myHead) {
      console.log('head not in localStorage')
      return;
    }
    myHead = JSONB.parse(myHead)

    // get all heads hashes in hex i'm suppose to publish
    var headsHashesHex = []
    // find all followers
    if (localStorage.following) {
      var following = JSON.parse(localStorage.following)
      headsHashesHex = following
    }
    // add my head to heads
    headsHashesHex.push(myHash)

    console.log('headsHashesHex', headsHashesHex)

    // now print first 10 tweets in all heads
    var toPublish = []
    for (var i=0; i<headsHashesHex.length; i++) {
      var headHash = headsHashesHex[i]
      var curr = localStorage[headHash]
      if (curr) curr = JSONB.parse(curr)

      if (headHash == myHash) curr.sign = opts.sign

      var c = 0

      while (curr) { // limit to 10
        c++;
        toPublish.push(curr)

        curr = curr.v.next
        if (curr) curr = curr.slice(0, 20)
        if (curr) curr = curr.toString('hex')
        if (curr) curr = localStorage[curr]
        if (curr) curr = JSONB.parse(curr)
        if (c >= this.limit) break;
      }
    }
    this.setState({ stack: toPublish.length })
    console.log('toPublish', toPublish)
    this.publishInChunks(toPublish, 0, this.chunkSize)

  }

  render() {
    // this publishes to the DHT, starting from my hash in localStorage
    return (
      <div className="sidebar-item ion-upload down" onClick={::this.publish} title={this.state.stack > 0 ? 'Currently publishing... ('+this.state.stack+')': 'Publish to the DHT, starting from my feed. Will publish next in '+this.state.timeRemaining+' min(s)'}>
      </div>
    );
  }
}
