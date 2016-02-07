import React, { Component } from 'react';
var bencode = require('bencode')
var JSONB = require('json-buffer')
import { DhtStore, dht, opts} from '../api/DhtStore'
import Tweet from './Tweet'
import SkipList from './SkipList'
import DhtPublish from './DhtPublish'

export default class Main extends Component {
  constructor(props) {
    super(props)
    this.state = {
      dhtArray : [],
      getResponse: null,
      putResponse: null,
      getRequest: null,
      putRequest: null
    }

    this.dht = dht

  }
  componentDidMount() {
    this.dht.listen(3000, function () {
      console.log('now listening on 3000 with default bootstrap nodes')
    })
    this.dht.on('ready', function () {
      console.log('WE ARE READY!')
    })

  }

  updateDhtArray(e) {
    this.setState({
      dhtArray: this.dht.toArray().length,
    });
  };

  get(e) {
    var that = this;
    this.dht.get(this.state.getRequest, function(err, res) {
      if(err) return console.error(err)
      if(res) {
        console.log(res)
        console.log(JSONB.stringify(res))
        console.log(JSONB.parse(JSONB.stringify(res)))
        that.setState({ getResponse : JSON.stringify(res.v) })
      } else {
        console.log(res)
      }
    })
  }

  put(e) {
    var data = this.state.putRequest;
    try {
      var obj = JSON.parse(data)
    } catch(e) {
      return console.error('error parsing JSON')
    }
    // must be a concatenated list of 3 Buffers
    // each being a hash of the next items in the skip list
    var a = new Buffer('c3bcf073c950cc07389dbdedb0d404a69726ccbc', 'hex')
    var b = new Buffer('c3bcf073c950cc07389dbdedb0d404a69726ccbc', 'hex')
    var tot = a.length + b.length
    obj.next = Buffer.concat([a, b], tot)
    opts.v = obj
    opts.seq = opts.seq + 1

    this.dht.put(opts, (errors, hash) => {
      console.error('errors=', errors)
      console.log('hash=', hash.toString('hex'))
      this.setState({ putResponse: hash.toString('hex') })

    })
  };

  onGetChange(e) {
    this.setState({ getRequest: e.target.value })
  };
  onPutChange(e) {
    this.setState({ putRequest: e.target.value })
  };

  render() {
    return (
      <div>
        My hash: {DhtStore.myHash()}
        <br/>
        <textarea value={this.state.getResponse}></textarea>
        <input type="text" onChange={::this.onGetChange} />
        <button onClick={::this.get}>GET</button>

        <br/>
        <textarea value={this.state.putResponse}></textarea>
        <input type="text" onChange={::this.onPutChange} />
        <button onClick={::this.put}>PUT</button>

        <br/>
        <textarea value={this.state.dhtArray}></textarea>
        <button onClick={::this.updateDhtArray}>Update DHT array</button>
        <br />
        <hr />

        <Tweet />
        <hr />

        <SkipList />
        <hr />

        // this publishes to the DHT, starting from my hash in localStorage
        <DhtPublish />
      </div>
    );
  }
}
