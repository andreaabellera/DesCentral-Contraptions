/*
 * Pasapasa IPFS
 *   A file sharing interface developed with IPFS
 * 
 * listener.js
 *   A listener (acting server) for the game room
 */

const Libp2p = require('libp2p')
const Bootstrap = require('libp2p-bootstrap')
const WebRTCDirect = require('libp2p-webrtc-direct')
const Mplex = require('libp2p-mplex')
const { Multiaddr } = require('multiaddr')
const { NOISE } = require('@chainsafe/libp2p-noise')
const PeerId = require('peer-id')
const { stdinToStream, streamToConsole } = require('./stream')

let peerMa = []

;(async () => {
  // Setup listener node
  const hardcodedPeerId = await PeerId.createFromJSON({
    "id": "12D3KooWCuo3MdXfMgaqpLC5Houi1TRoFqgK9aoxok4NK5udMu8m",
    "privKey": "CAESQAG6Ld7ev6nnD0FKPs033/j0eQpjWilhxnzJ2CCTqT0+LfcWoI2Vr+zdc1vwk7XAVdyoCa2nwUR3RJebPWsF1/I=",
    "pubKey": "CAESIC33FqCNla/s3XNb8JO1wFXcqAmtp8FEd0SXmz1rBdfy"
  })
  const node = await Libp2p.create({
    peerId: hardcodedPeerId,
    addresses: {
      listen: ['/ip4/127.0.0.1/tcp/12345/http/p2p-webrtc-direct']
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

  // Start listen
  await node.start()
  console.log('Listening on ')
  node.multiaddrs.forEach((ma) => console.log(`${ma.toString()}/p2p/${node.peerId.toB58String()}`))

  // Detect new peer
  node.connectionManager.on('peer:connect', (connection) => {
    let peerId = connection.remotePeer.toB58String()
    console.info(`Connected to ${peerId}!`)

    // Add to record of peers
    let ma = new Multiaddr(`/ip4/127.0.0.1/tcp/12345/http/p2p-webrtc-direct/p2p/${peerId}`)
    peerMa.push(ma)
  })

  // Add new peer that joined
  await node.handle('/join/1.0.0', async ({ stream }) => {
    let name = await streamToConsole(stream)
    console.log(name + " has joined the peer room")
    
    // Notify all peers with new buddy that joined
    if(name){
      for(let ma of peerMa){
        const { stream } = await node.dialProtocol(ma, '/joinRelay/1.0.0')
        stdinToStream(stream, name)
      }
    }
  })

  // Send new chat message
  await node.handle('/chat/1.0.0', async ({ stream }) => {
    let message = await streamToConsole(stream)
    
    if(message){
      for(let ma of peerMa){
        const { stream } = await node.dialProtocol(ma, '/chatRelay/1.0.0')
        stdinToStream(stream, message)
      }
    }
  })

})()