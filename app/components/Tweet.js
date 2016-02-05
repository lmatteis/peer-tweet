import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'

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
  tweet() {
    // first get my hash to get the seq number
    dht.get(DhtStore.myHash(), (err, res) => {
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
