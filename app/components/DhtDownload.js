import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import Tweet from './Tweet'
import SkipList from './SkipList'

export default class DhtDownload extends Component {
  constructor(props) {
    super(props)
    this.state = {
      stack: 0
    }
  }

  downloadRecursion(hash, isHead) {
    var curr = localStorage[hash]
    if (curr && !isHead) { // we already have it, go to next
      curr = JSONB.parse(curr)
      console.log('already have', hash, 'in localstorage')

      if (!curr.v.next) {
        this.setState((state) => ({ stack: state.stack - 1 }))
        if (this.state.stack == 0) {
          console.log('download finished')
        }
        return;
      }
      var next = curr.v.next.slice(0, 20) // only first 20 bytes
      return this.downloadRecursion(next.toString('hex'))
    }

    console.log('dht.get()ing', hash)
    dht.get(hash, (err, res) => {
      if (!res) {
        this.setState((state) => ({ stack: state.stack - 1 }))
        return;
      }
      console.log('got and storing', hash)
      localStorage[hash] = JSONB.stringify(res)
      if (res.v.next) {
        var next = res.v.next.slice(0, 20) // only first 20 bytes
        this.downloadRecursion(next.toString('hex'))
      } else {
        this.setState((state) => ({ stack: state.stack - 1 }))
      }

    })

    /*
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
      this.downloadRecursion(curr)

    })
    */
  }

  download(e) {
    // start from getting head
    var myHash = DhtStore.myHash()

    var heads = []
    // find all followers
    if (localStorage.following) {
      var following = JSON.parse(localStorage.following)
      heads = following
    }
    // add my head to heads
    heads.push(myHash)


    for(var i=0; i<heads.length; i++) {
      var head = heads[i]
      console.log('starting to download', head)
      this.setState((state) => ({ stack: state.stack + 1 }))
      this.downloadRecursion(head, true)
    }

    // if (curr.v.f && isMyFeed) { // we have a follow hash! branch out!
    //   console.log('have a follower. branching out')
    //   this.setState((state) => ({ stack: state.stack + 1 }))
    //   this.downloadRecursion(curr.v.f.toString('hex'), false, true)
    // }

  }

  render() {
    // downloads all the feeds i'm following
    // including my own feed - it doesn't dht.get() them if already in localStorage
    return (
      <div className="sidebar-item ion-ios-cloud-download down" onClick={::this.download} title="Start downlading all the feeds you're following to see if there are any changes">
        {this.state.stack}
      </div>
    );
  }
}
