import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
var crypto = require('crypto')

import { DhtStore, dht, opts, sha1 } from '../api/DhtStore'



export default class Tweet extends Component {
  constructor(props) {
    super(props)
    this.state = {
      tweet: ''
    }
  }
  componentDidMount() {

  }

  onTweetChange(e) {
    this.setState({ tweet: e.target.value })
  }

  findNext(head) {
    // it has to be 1 hop, 2 hops, 4 hops and 8 hops away
    var arr = []
    var curr = head
    while (curr.v.next && arr.length <= 8) {
      // curr.next is a buffer of many bytes, only get the first 20
      var next = curr.v.next.slice(0, 20)
      arr.push(next)
      curr = JSONB.parse(localStorage[next.toString('hex')])
    }
    // return max 4 items arrays
    var retArr = []
    if (arr[0])
      retArr.push(arr[0]) // 1 hop away
    if (arr[1])
      retArr.push(arr[1]) // 2 hops
    if (arr[3])
      retArr.push(arr[3]) // 4 hops
    if (arr[7])
      retArr.push(arr[7]) // 8 hops

    var tot = 0
    for (var i=0; i<retArr.length; i++) {
      tot += retArr[i].length
    }

    //console.log(retArr, tot)

    return Buffer.concat(retArr, tot)
  }

  findNextHead(bHash) {
    // it has to be the first 4 items
    var arr = []
    var curr = JSONB.parse(localStorage[bHash.toString('hex')])
    arr.push(bHash) // first hash
    while (curr.v.next && arr.length <= 3) {
      // curr.next is a buffer of many bytes, only get the first 20
      var next = curr.v.next.slice(0, 20)
      arr.push(next)
      curr = JSONB.parse(localStorage[next.toString('hex')])
    }

    var tot = 0
    for (var i=0; i<arr.length; i++) {
      tot += arr[i].length
    }
    console.log(arr, tot)

    return Buffer.concat(arr, tot)
  }

  getCurrentTimestamp() {
    // get millis in UTC
    //var now = new Date()
    //var millis = now.getTime() + (now.getTimezoneOffset() * 60000)
    var dateInMinutes = Math.floor(Math.floor(Date.now() / 1000) / 60)
    var length = Math.ceil((Math.log(dateInMinutes)/Math.log(2))/8);
    var buff = new Buffer(length)
    buff.writeUIntBE(dateInMinutes, 0, length);
    return buff;
  }

  tweet(type) {
    var myHash = DhtStore.myHash()
    var myFeed = localStorage[myHash]
    var timestamp = this.getCurrentTimestamp()

    var iopts = {}
    if (type == 'tweet') {
      iopts.v = {
        t: new Buffer(this.state.tweet)
      }
    } else if (type == 'follow') {
      var followHash = DhtStore.base58toHash(this.state.tweet)
      if (followHash == myHash) {
        return console.error('cant follow yourself!');
      }
      iopts.v = {
        // f is a hash
        f: new Buffer(followHash, 'hex')
      }
    }

    iopts.v.d = timestamp

    // figure out what `next` is and our `seq`
    if (!myFeed) { // we have nothing locally
      opts.seq = 0 // it's the first tweet
    } else {
      var head = JSONB.parse(myFeed)

      opts.seq = head.seq + 1
      // it has to be 1 hop, 2 hops, 4 hops and 8 hops away
      iopts.v.next = this.findNext(head)
    }

    // create immutable tweet
    // and have head point to it
    var bHash = sha1(bencode.encode(iopts.v))
    var hash = bHash.toString('hex')
    localStorage[hash] = JSONB.stringify(iopts)

    // now change my head
    opts.v = {
      n: '@lmatteis',
      d: timestamp,
      next: this.findNextHead(bHash) // this should be at least the first 4 hashes (80 bytes)
    }
    localStorage[myHash] = JSONB.stringify(opts);

    this.props.onTweetOrFollow()
  }

  tweetDHT() {
    // first get my hash to get the seq number
    var myHash = DhtStore.myHash()
    dht.get(myHash, (err, res) => {
      console.log('got my hash', res)
      if (!res) { // either it's first time posting or head expired from DHT

        // create first immutable tweet with no "next"
        // and have head point to it
        dht.put({ v: { t: this.state.tweet } }, (err, hash) => {
          console.log('put immutabile tweet', hash)

          // write head, and point next to this hash
          // must be a concatenated list of 3 Buffers
          // each being a hash of the next items in the skip list
          opts.v = {
            n: '@lmatteis',
            next: hash
          }
          opts.seq = 0 // it's the first tweet
          dht.put(opts, (err, res) => {
            console.log('put mutable head', res)

          })

        })
      } else { // we have already a head
        // still put the tweet, but now use the head's next value
        dht.put({ v: { t: this.state.tweet, next: res.v.next } }, (err, hash) => {
          console.log('put immutabile tweet', hash)

          // write head, and point next to this hash
          // must be a concatenated list of 3 Buffers
          // each being a hash of the next items in the skip list
          opts.v = {
            n: '@lmatteis',
            next: hash
          }
          opts.seq = res.seq + 1
          dht.put(opts, (err, res) => {
            console.log('put mutable head', res)

          })

        })

      }


      // create the immutable tweet
    })

  }

  render() {
    return (
      <div>
        <input type="text" onChange={::this.onTweetChange} />
        <button onClick={this.tweet.bind(this, 'tweet')}>Tweet</button>
        <button onClick={this.tweet.bind(this, 'follow')}>Follow</button>
      </div>
    );
  }
}
