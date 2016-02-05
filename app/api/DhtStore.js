var DHT = require('bittorrent-dht')
var ed = require('ed25519-supercop')
var bencode = require('bencode')
var JSONB = require('json-buffer')
var crypto = require('crypto')


console.log('initting DHT')
export var dht = new DHT({ verify: ed.verify })

if (!localStorage.publicKey || !localStorage.secretKey) {
  var keypair = ed.createKeyPair(ed.createSeed())
  localStorage.publicKey = keypair.publicKey.toString('hex')
  localStorage.secretKey = keypair.secretKey.toString('hex')
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
