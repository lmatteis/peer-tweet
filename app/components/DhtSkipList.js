import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import Tweet from './Tweet'
import SkipList from './SkipList'

export default class DhtSkipList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      base58: '',
      tweets: []
    }
    this.gotHashes = {}
  }
  onBase58Change(e) {
    this.setState({ base58: e.target.value })
  }

  start(hash) {
    if (this.gotHashes[hash]) return console.log('we already got this hash', hash)
    console.log('getting', hash.toString('hex'))
    dht.get(hash, (err, res) => {
      // concurrently get all hashes in all .next fields :) and cache the hash in this.state
      // hashes are in 20 bytes chunks in .next
      if (res) {
        this.gotHashes[hash] = true
        if (res.v.t)
          this.setState((state) => { tweets: state.tweets.push(res.v.t.toString('utf-8')) })
        else if (res.v.n) // feed name
          this.setState((state) => { tweets: state.tweets.push(res.v.n.toString('utf-8')) })
        else if (res.v.f)
          this.setState((state) => { tweets: state.tweets.push(res.v.f.toString('hex')) })

        var buff = res.v.next
        if (!buff) return console.error('hash doesnt have a next field', hash);
        var chunkSize = 20
        for (var i = 0; i < buff.length; i = i + chunkSize) {
          var slicedHash = buff.slice(i, i + chunkSize)
          this.start(slicedHash)
        }
      }
    })
  }

  skip(e) {
    this.gotHashes = {}
    this.setState({tweets: []})
    this.start(DhtStore.base58toHash(this.state.base58))
    // start from getting head
    //var myHash = DhtStore.myHash()


    // i guess we can start publishing head
    //console.log('starting to download head')
    //this.downloadRecursion(myHash, true, false)

  }

  render() {
    return (
      <div>
        <br />
        <input type="text" onChange={::this.onBase58Change} />
        <button onClick={::this.skip}>dht skiplist iterate</button>
        <div>
          {this.state.tweets.map(function(tweet) {
            return <div key={tweet}>{tweet}</div>
          })}
        </div>
      </div>
    );
  }
}
