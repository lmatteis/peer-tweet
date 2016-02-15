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

const remote = require('electron').remote;

export default class Main extends Component {
  constructor(props) {
    super(props)
    this.state = {
      page: 'timeline'
    }
  }

  render() {
    var content;
    if (this.state.page == 'timeline')
      content = <Timeline />
    else if (this.state.page == 'address')
      content = <Address hashHex={this.state.hashHex} />
    else if (this.state.page == 'settings')
      content = <Settings />

    return (
      <div className="flexbox-container">
        <div className="flexbox-sidebar">
          <div className="sidebar-item ion-home top"
               onClick={
              () => this.setState({
                page: 'timeline',
              })}></div>
          <div className="sidebar-item ion-person"
               onClick={
              () => this.setState({
                page: 'address',
                hashHex: DhtStore.myHash()
              })}></div>
          <DhtPublish every="1800000"/>
          <DhtDownload />
          <div className="sidebar-item ion-gear-a"
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
