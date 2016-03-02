import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import Tweet from './Tweet'
import SkipList from './SkipList'
import FastDhtPublish from './FastDhtPublish'
import DhtDownload from './DhtDownload'
import DhtSkipList from './DhtSkipList'
import Timeline from './Timeline'
import Address from './Address'
import Settings from './Settings'
import Following from './Following'

const remote = require('electron').remote;
import { currentPageStore } from '../stores'


export default class Main extends Component {
  constructor(props) {
    super(props)
    this.myHash = DhtStore.myHash()
    var myLocalstorageHead = localStorage[this.myHash]

    this.state = {
      page: 'timeline',
      myHead: { v: {}}
    }
    if (myLocalstorageHead)
      this.state.myHead = JSONB.parse(myLocalstorageHead)

    this.unsubscribe = currentPageStore.subscribe(() => {
      this.setState(currentPageStore.getState())
    })
  }
  componentWillUnmount() {
    this.unsubscribe()
  }

  render() {
    var content;
    if (this.state.page == 'timeline')
      content = <Timeline key={Date.now()}/>
    else if (this.state.page == 'address')
      content = <Address hashHex={this.state.hashHex} />
    else if (this.state.page == 'following')
      content = <Following key={Date.now()}/>
    else if (this.state.page == 'settings')
      content = <Settings />

    var myHash = DhtStore.myHash()
    return (
      <div className="flexbox-container">
        <div className="flexbox-sidebar">
          <div className="sidebar-item ion-person top" title="My feed"
               onClick={
              () => this.setState({
                page: 'address',
                hashHex: myHash
              })}>

            {this.state.myHead.v.a ? <img src={this.state.myHead.v.a} /> : null}
          </div>
          <div className={'sidebar-item ion-home' + (this.state.page == 'timeline' ? ' selected' : '' )}
               title="Timeline"
               onClick={
              () => this.setState({
                page: 'timeline',
              })}>
          </div>
          <div className={'sidebar-item ion-ios-people' + (this.state.page == 'following' ? ' selected' : '' )}
             title="Feeds I'm following"
             onClick={
            () => this.setState({
              page: 'following'
            })}></div>
          <div className={'sidebar-item ion-gear-a' + (this.state.page == 'settings' ? ' selected' : '' )}
            title="Settings"
            onClick={() => this.setState({ page: 'settings'})}
            ></div>
          <div className="sidebar-item space"></div>
          
          <FastDhtPublish every="1800000" />
          <DhtDownload every="1800000" />
        </div>
        <div className="flexbox-content">
          {content}
        </div>
      </div>
    );
  }
}
