import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import Tweet from './Tweet'
import SkipList from './SkipList'
import { tweetsStore, currentPageStore } from '../stores'
const shell = require('electron').shell;

export default class Main extends Component {
  constructor(props) {
    super(props)
    this.state = {
      tweets: []
    }
    this.pageLength = 3

    this.unsubscribe = tweetsStore.subscribe(() => {
      var s = tweetsStore.getState()
      if (s == 'RESET')
        return this.setState({ tweets: [] })

      this.setState((state) => { tweets: state.tweets.push(s) })
    })
  }
  componentDidMount() {
    var localHashHex = localStorage[this.props.hashHex]
    if (localHashHex) {
      this.head = JSONB.parse(localHashHex)
      this.headHex = this.props.hashHex
    } else {
      this.headHex = DhtStore.myHash()
      if (localStorage[this.headHex])
        this.head = JSONB.parse(localStorage[this.headHex])
    }
    this.reiterate(this.headHex, this.props.following)
  }
  componentWillUnmount() {
    this.unsubscribe()
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
    var feed = localStorage[hashHex]

    if (!feed) return;

    var tweets = []

    if (following) {
      var foll = localStorage.following
      if (foll) {
        foll = JSON.parse(foll)
        for(var i=0; i<foll.length; i++) {
          var fhash = foll[i]
          var followingData = localStorage[fhash]
          if (followingData) {
            followingData = JSONB.parse(followingData)

            tweets.push({
              key: fhash,
              hashHex: fhash,
              nickname: followingData.v.n,
              avatar: followingData.v.a,
              value: followingData.v
            })
          }

        }
      }
    } else {
      var curr = JSONB.parse(feed)

      while (curr.v.next) { // only first 10
        // curr.next is a buffer of many bytes, only get the first 20
        var next = curr.v.next.slice(0, 20)
        var l = localStorage[next.toString('hex')]
        if (!l) break;
        curr = JSONB.parse(l)

        tweets.push({
          key: next.toString('hex'),
          hashHex: this.headHex,
          nickname: this.head.v.n,
          avatar: this.head.v.a,
          value: curr.v
        })

      }

      if (this.props.timeline) { // also get stuff in localStorage.following
        var followingLocal = localStorage.following
        if (followingLocal) {
          followingLocal = JSON.parse(followingLocal)

          for(var i=0; i<followingLocal.length; i++) {
            var fhash = followingLocal[i]
            var followerFeed = localStorage[fhash]
             if (followerFeed) {
               var followerCurr = JSONB.parse(followerFeed) // follower head
               var originalFollowerCurr = followerCurr
               while (followerCurr.v.next) {
                 var n = followerCurr.v.next.slice(0, 20)
                 var nl = localStorage[n.toString('hex')]
                 if (!nl) break;
                 followerCurr = JSONB.parse(nl)
                 if (followerCurr.v.t) {
                   //arr.push(followerCurr.v.t.toString('utf-8') +' by '+ curr.v.f.toString('hex'))
                   var t = {
                     key: n.toString('hex'),
                     hashHex: fhash,
                     nickname: originalFollowerCurr.v.n,
                     avatar: originalFollowerCurr.v.a,
                     value: followerCurr.v
                   }
                   tweets.push(t)
                 }
               }
             }
          }

        }
      }

    }

    this.setState({tweets: tweets.sort(function (a, b) {
      var aTweetMinutes = a.value.d.readUIntBE(0, a.value.d.length)
      var bTweetMinutes = b.value.d.readUIntBE(0, b.value.d.length)

      if(aTweetMinutes > bTweetMinutes) return -1;
      if(aTweetMinutes < bTweetMinutes) return 1;
      return 0;
    })})

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

  showTime(tweetMinutes) {
    var currDateInMinutes = Math.floor(Math.floor(Date.now() / 1000) / 60)
    var minutesPassed = (currDateInMinutes - tweetMinutes)
    if (minutesPassed < 60)
      return Math.floor(minutesPassed) + 'm'
    var hoursPassed = minutesPassed / 60
    if (hoursPassed < 24)
      return Math.floor(hoursPassed) + 'h'
    var daysPassed = hoursPassed / 24
    if (daysPassed < 30)
      return Math.floor(daysPassed) + 'd'
    var monthsPassed = daysPassed / 30
    return Math.floor(monthsPassed) + 'month'
  }

  render() {
    return (
      <div>
        {this.state.tweets.map((tweet) => {
          var text = ''
          var tweetMinutes = tweet.value.d.readUIntBE(0, tweet.value.d.length)
          var d = new Date(0)
          d.setUTCMinutes(tweetMinutes)
          if (tweet.value.t) {
            text = tweet.value.t.toString('utf8')
          } else if (tweet.value.f) { // follow
            text = <span>Following <a href="#" onClick={this.goToAddress.bind(this, tweet.value.f.toString('hex'))}>@{DhtStore.hashToBase58(tweet.value.f.toString('hex'))}</a></span>
          }

          var urlPattern = /(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/g

          var url = text.toString().match(urlPattern)

          if (url) {
            var parts = text.split(url[0]);
            text = []
            text[0] = parts[0]
            text[1] = <a href="#" onClick={() => shell.openExternal(url[0])}>{url[0]}</a>
            text[2] = parts[1];
          }


          return <div className="tweet" key={tweet.key}>
            {tweet.nickname ? <b>{tweet.nickname.toString()}</b> : null} <a href="#" className="address" onClick={this.goToAddress.bind(this, tweet.hashHex)}>@{DhtStore.hashToBase58(tweet.hashHex)}</a>
            <div className="minutes-ago">
              {this.showTime(tweetMinutes)}
            </div>
            <div>{text}</div>
            { (url) ? <img className="media" src={url} /> : null}
            <div className="avatar">
              { tweet.avatar ? <img src={tweet.avatar.toString()} /> : <div className="default-avatar ion-person"></div> }
            </div>
          </div>
        })}
      </div>
    );
  }
}
