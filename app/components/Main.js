import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import Tweet from './Tweet'
import SkipList from './SkipList'
import DhtPublish from './DhtPublish'
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

    currentPageStore.subscribe(() => {
      this.setState(currentPageStore.getState())
    })
  }

  render() {
    var content;
    if (this.state.page == 'timeline')
      content = <Timeline />
    else if (this.state.page == 'address')
      content = <Address hashHex={this.state.hashHex} />
    else if (this.state.page == 'following')
      content = <Following />
    else if (this.state.page == 'settings')
      content = <Settings />

    console.log(this.state.myHead)
    return (
      <div className="flexbox-container">
        <div className="flexbox-sidebar">
          <div className="sidebar-item ion-home top"
               onClick={
              () => this.setState({
                page: 'timeline',
              })}>
            {this.state.myHead.v.a ? <img src={this.state.myHead.v.a} /> : null}
          </div>
          <div className="sidebar-item ion-person"
               onClick={
              () => this.setState({
                page: 'address',
                hashHex: DhtStore.myHash()
              })}></div>
            <div className="sidebar-item ion-ios-people"
             onClick={
            () => this.setState({
              page: 'following'
            })}></div>
          <DhtPublish every="1800000"/>
          <DhtDownload />
          <div className="sidebar-item ion-gear-a" title="Settings"
            onClick={() => this.setState({ page: 'settings'})}
            ></div>
        </div>
        <div className="flexbox-content">
          {content}
        </div>
      </div>
    );
  }
}
