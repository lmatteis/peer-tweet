import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import Tweet from './Tweet'
import SkipList from './SkipList'
import { currentPageStore } from '../stores'

export default class Main extends Component {
  constructor(props) {
    super(props)
    this.state = {
      tweets: []
    }
  }
  componentDidMount() {
    this.reiterate(this.props.hashHex, this.props.following)
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

  reiterate(hashHex, following) {
    this.setState({ tweets: [] })
    // start from getting head
    var myHash = DhtStore.myHash()
    var myFeed = localStorage[hashHex || myHash]

    if (!myFeed) return;

    var head = JSONB.parse(myFeed)

    var arr = []
    var tweets = []
    var curr = head
    while (curr.v.next/* && arr.length < 10*/) { // only first 10
      // curr.next is a buffer of many bytes, only get the first 20
      var next = curr.v.next.slice(0, 20)
      var l = localStorage[next.toString('hex')]
      if (!l) break;
      curr = JSONB.parse(l)

      tweets.push({
        hashHex: hashHex || myHash,
        nickname: head.v.n,
        avatar: head.v.a,
        value: curr.v
      })
      if (curr.v.t) {
        var d = new Date(0)
        d.setUTCMinutes(curr.v.d.readUIntBE(0, curr.v.d.length))
        arr.push(curr.v.t.toString('utf-8') + ' - ' + d)
      } else if (curr.v.f && !hashHex) { // follow
        var followerFeed = localStorage[curr.v.f.toString('hex')]
        if (followerFeed) {
          var followerCurr = JSONB.parse(followerFeed) // follower head
          var originalFollowerCurr = followerCurr
          while (followerCurr.v.next) {
            var n = followerCurr.v.next.slice(0, 20)
            var nl = localStorage[n.toString('hex')]
            if (!nl) break;
            followerCurr = JSONB.parse(nl)
            if (followerCurr.v.t) {
              arr.push(followerCurr.v.t.toString('utf-8') +' by '+ curr.v.f.toString('hex'))
              tweets.push({
                hashHex: curr.v.f.toString('hex'),
                nickname: originalFollowerCurr.v.n,
                avatar: originalFollowerCurr.v.a,
                value: followerCurr.v
              })

            }
          }
        }
        arr.push('following ' + curr.v.f.toString('hex'))
      }
    }
    //this.setState({ tweets : arr })
    if (following) {
      this.setState({tweets: tweets.filter(function (tweet) {
        if (tweet.value.f)
          return tweet;
      })})
    } else {
      this.setState({tweets: tweets})
    }

    /*
    dht.get(DhtStore.myHash(), (err, res) => {
      console.log('got head', res)

      if (res)
      // now we get the next hash!
      if (res && res.v.next) {
        this.getTweet(res.v.next)
      }

    })
    */
  }
  goToAddress(hashHex) {
    //console.log(hashHex)
    currentPageStore.dispatch({
      type: 'SET_CURRENT_PAGE',
      page: 'address',
      hashHex: hashHex
    })
    //this.reiterate(hashHex)
  }

  render() {
    return (
      <div>
        {this.state.tweets.map((tweet) => {
          var text = ''
          var currDateInMinutes = Math.floor(Math.floor(Date.now() / 1000) / 60)
          var tweetMinutes = tweet.value.d.readUIntBE(0, tweet.value.d.length)
          var d = new Date(0)
          d.setUTCMinutes(tweetMinutes)
          if (tweet.value.t) {
            text = tweet.value.t.toString('utf8')
          } else if (tweet.value.f) { // follow
            text = 'following: ' + DhtStore.hashToBase58(tweet.value.f.toString('hex'))
          }
          return <div className="tweet" key={d.getTime() + text}>
            {tweet.nickname ? <b>{tweet.nickname.toString()}</b> : null} <a href="#" className="address" onClick={this.goToAddress.bind(this, tweet.hashHex)}>@{DhtStore.hashToBase58(tweet.hashHex)}</a>
            <div className="minutes-ago">
              {currDateInMinutes - tweetMinutes}m
            </div>
            <div>{text}</div>
            <div className="avatar">
              { tweet.avatar ? <img src={tweet.avatar} /> : <div className="default-avatar ion-person"></div> }
            </div>
          </div>
        })}
      </div>
    );
  }
}
