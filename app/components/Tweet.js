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
      retArr.push(arr[7]) // 7 hops

    var tot = 0
    for (var i=0; i<retArr.length; i++) {
      tot += retArr[i].length
    }

    console.log(retArr, tot)

    return Buffer.concat(retArr, tot)
  }

  tweet() {
    var myHash = DhtStore.myHash()
    var myFeed = localStorage[myHash]

    var iopts = {}
    iopts.v = {
      t: new Buffer(this.state.tweet)
    }

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
      next: bHash
    }
    localStorage[myHash] = JSONB.stringify(opts);
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
        <button onClick={::this.tweet}>Tweet</button>
      </div>
    );
  }
}
