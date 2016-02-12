var DHT = require('bittorrent-dht')
var ed = require('ed25519-supercop')
var bencode = require('bencode')
var JSONB = require('json-buffer')
var crypto = require('crypto')
const remote = require('electron').remote;

console.log('initting DHT')
export var dht = new DHT({ verify: ed.verify })

var port = remote.process.env.PORT || 3000
dht.listen(port, function () {
  console.log('now listening on '+port+' with default bootstrap nodes')
})
dht.on('ready', function () {
  console.log('WE ARE READY!')
})


if (!localStorage.publicKey || !localStorage.secretKey) {
  var keypair = ed.createKeyPair(ed.createSeed())
  localStorage.publicKey = keypair.publicKey.toString('hex')
  localStorage.secretKey = keypair.secretKey.toString('hex')
}

// restore DHT nodes that have been persisted to disk
window.onbeforeunload = (e) => {
  localStorage['dht-nodes'] = JSON.stringify(dht.toArray())
}
if (localStorage['dht-nodes']) {
  var dhtNodes = JSON.parse(localStorage['dht-nodes'])
  dhtNodes.forEach(function (node) {
    dht.addNode(node)
  })
}

console.log('pub key', localStorage.publicKey)

var buffPubKey = Buffer(localStorage.publicKey, 'hex')
var buffSecKey = Buffer(localStorage.secretKey, 'hex')
export var opts = {
  k: buffPubKey,
  seq: -1,
  sign: function (buf) {
    return ed.sign(buf, buffPubKey, buffSecKey)
  }
}

export function sha1 (buf) {
  return crypto.createHash('sha1').update(buf).digest()
}

export var DhtStore = {
  myHash: function() {
    var k = Buffer(localStorage.publicKey, 'hex')
    return crypto.createHash('sha1').update(k).digest('hex')
  },
  get: function(hash, callback) {
    // check if this hash is in localStorage
    if (localStorage[hash]) {
      return callback(false, JSONB.parse(localStorage[hash]))
    }

    // contact network
    dht.get(hash, function(err, res) {
      if (err) return console.error(err)
      if (res) {
        localStorage[hash] = JSONB.stringify(res);
        callback(err, res)
      }
    })
  }
}
