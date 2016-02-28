import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import Tweet from './Tweet'
import SkipList from './SkipList'
import { currentPageStore, tweetsStore } from '../stores'

export default class DhtSkipList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      base58: '',
    }
    this.gotHashes = {}
    this.gettingHashes = {}
  }
  onBase58Change(e) {
    this.setState({ base58: e.target.value })
  }

  start(hash, headHex) {
    hash = hash.toString('hex')
    if (this.gotHashes[hash])
      return console.log('we already got this hash', hash)
    if (this.gettingHashes[hash])
      return console.log('already getting this hash', hash)

    if (Object.keys(this.gettingHashes).length >= 10)
      return console.log('we got 10 items!')

    console.log('getting', hash)
    this.gettingHashes[hash] = true
    dht.get(hash, (err, res) => {
      // concurrently get all hashes in all .next fields :) and cache the hash in this.state
      // hashes are in 20 bytes chunks in .next
      if (res) {
        this.gotHashes[hash] = res
        var action = {
          type: 'ADD_TWEET',
          tweet: {
            key: hash,
            hashHex: headHex,
            nickname: this.gotHashes[headHex].v.n,
            avatar: this.gotHashes[headHex].v.a,
            value: res.v
          }
        }
        if (hash != headHex) // it's head, don't add it to the view
          tweetsStore.dispatch(action)
        /*
        if (res.v.t)
          this.setState((state) => { tweets: state.tweets.push(res.v.t.toString('utf-8')) })
        else if (res.v.n) // feed name
          this.setState((state) => { tweets: state.tweets.push(res.v.n.toString('utf-8')) })
        else if (res.v.f)
          this.setState((state) => { tweets: state.tweets.push(res.v.f.toString('hex')) })
        */
        var buff = res.v.next
        if (!buff) return console.error('hash doesnt have a next field', hash);
        var chunkSize = 20
        for (var i = 0; i < buff.length; i = i + chunkSize) {
          var slicedHash = buff.slice(i, i + chunkSize)
          this.start(slicedHash, headHex)
        }
      }
    })
  }

  skip(e) {
    tweetsStore.dispatch({ type: 'RESET'})
    this.gotHashes = {}
    this.gettingHashes = {}
    var headHex = DhtStore.base58toHash(this.state.base58)
    this.start(headHex, headHex)
    // start from getting head
    //var myHash = DhtStore.myHash()


    // i guess we can start publishing head
    //console.log('starting to download head')
    //this.downloadRecursion(myHash, true, false)

  }

  render() {
    return (
      <div>
        <input type="text" onChange={::this.onBase58Change} />
        <button onClick={::this.skip}>dht skiplist iterate</button>

        { false &&
        <div>
          {this.state.tweets.map(function(tweet) {
            return <div key={tweet}>{tweet}</div>
          })}
        </div>
        }
      </div>
    );
  }
}
