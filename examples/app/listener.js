const Libp2p = require('libp2p')
const Bootstrap = require('libp2p-bootstrap')
const WebRTCDirect = require('libp2p-webrtc-direct')
const Mplex = require('libp2p-mplex')
const { Multiaddr } = require('multiaddr')
const { NOISE } = require('@chainsafe/libp2p-noise')
const PeerId = require('peer-id')
const { stdinToStream, streamToConsole } = require('./stream')

let peers = {}
let peerMa = []
let peerCount = 0

;(async () => {
  // hardcoded peer id to avoid copy-pasting of listener's peer id into the dialer's bootstrap list
  // generated with cmd `peer-id --type=ed25519`
  const hardcodedPeerId = await PeerId.createFromJSON({
    "id": "12D3KooWCuo3MdXfMgaqpLC5Houi1TRoFqgK9aoxok4NK5udMu8m",
    "privKey": "CAESQAG6Ld7ev6nnD0FKPs033/j0eQpjWilhxnzJ2CCTqT0+LfcWoI2Vr+zdc1vwk7XAVdyoCa2nwUR3RJebPWsF1/I=",
    "pubKey": "CAESIC33FqCNla/s3XNb8JO1wFXcqAmtp8FEd0SXmz1rBdfy"
  })
  const node = await Libp2p.create({
    peerId: hardcodedPeerId,
    addresses: {
      listen: ['/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct']
    },
    modules: {
      transport: [WebRTCDirect],
      streamMuxer: [Mplex],
      connEncryption: [NOISE]
    },
    config: {
      peerDiscovery: {
        [Bootstrap.tag]: {
          enabled: false,
        }
      }
    }
  })

  node.connectionManager.on('peer:connect', (connection) => {
    peerCount++
    let peerId = connection.remotePeer.toB58String()
    peers[peerId] = peerCount.toString()
    let ma = new Multiaddr(`/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct/p2p/${peerId}`)
    peerMa.push(ma)
    console.info(`Connected to ${peerId}!`)
    showPeers()
  })

  await node.handle('/chat/1.0.0', async ({ connection, stream }) => {
    let name = await streamToConsole(stream)
    let peerId = connection.remotePeer.toB58String()

    console.log(peerId + " has changed nickname to " + name)
    peers[peerId] = name
    
    showPeers()
    if(name){
      for(let ma of peerMa){
        const { stream } = await node.dialProtocol(ma, '/update/1.0.0')
        stdinToStream(stream,name)
      }
    }
  })

  await node.start()

  console.log('Listening on ')
  node.multiaddrs.forEach((ma) => console.log(`${ma.toString()}/p2p/${node.peerId.toB58String()}`))
})()

function showPeers(){
  //console.log(Object.keys(peers))
  console.log("Peers in the House: " + Object.values(peers).join(", "))
}