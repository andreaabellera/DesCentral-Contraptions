const Libp2p = require('libp2p')
const Bootstrap = require('libp2p-bootstrap')
const WebRTCDirect = require('libp2p-webrtc-direct')
const Mplex = require('libp2p-mplex')
const { Multiaddr } = require('multiaddr')
const { NOISE } = require('@chainsafe/libp2p-noise')
const PeerId = require('peer-id')
const { stdinToStream, streamToConsole } = require('./stream')

let peers = {}
let peerStatus = {}
let peerMa = []
let peerCount = 0

;(async () => {
  // Setup Node
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

  // Detect new peer
  node.connectionManager.on('peer:connect', (connection) => {
    peerCount++
    let peerId = connection.remotePeer.toB58String()
    peers[peerId] = peerCount.toString()
    peerStatus[peerId] = false
    console.info(`Connected to ${peerId}!`)
    showPeers()

    // Add to record of peers
    let ma = new Multiaddr(`/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct/p2p/${peerId}`)
    peerMa.push(ma)
  })

  // Update nickname
  await node.handle('/chat/1.0.0', async ({ connection, stream }) => {
    let name = await streamToConsole(stream)
    let peerId = connection.remotePeer.toB58String()
    console.log(peerId + " has changed nickname to " + name)
    peers[peerId] = name
    
    showPeers()

    // Update all dialers with new nickname
    if(name){
      for(let ma of peerMa){
        const { stream } = await node.dialProtocol(ma, '/update/1.0.0')
        stdinToStream(stream,name)
      }
    }
  })

  // Receive start signal
  await node.handle('/start/1.0.0', async ({ connection, stream }) => {
    let signal = await streamToConsole(stream)
    let peerId = connection.remotePeer.toB58String()
    let tokens = signal.split(" ")
    let name = tokens[0]
    let ready = tokens[1] == "true"
    let startEcho = "Player " + name
    if(ready)
      startEcho += " is ready"
    else
      startEcho += " is not ready"

    peerStatus[peerId] = ready
    startEcho += checkStart()

    // Update all dialers with start signal
    for(let ma of peerMa){
      const { stream } = await node.dialProtocol(ma, '/startEcho/1.0.0')
      stdinToStream(stream,startEcho)
    }
  })

  // Pass ball to a player
  await node.handle('/pass/1.0.0', async ({ connection, stream }) => {
    let passName = await streamToConsole(stream)
    let peerId = connection.remotePeer.toB58String()

    if(passName == "random"){
      let player = Math.floor(Math.random() * peerMa.length)
      const { stream } = await node.dialProtocol(peerMa[player], '/receive/1.0.0')
      let message = "You got the ball"
      stdinToStream(stream,message)
    }
  })

  // Start listen
  await node.start()
  console.log('Listening on ')
  node.multiaddrs.forEach((ma) => console.log(`${ma.toString()}/p2p/${node.peerId.toB58String()}`))

})()

function showPeers(){
  //console.log(Object.keys(peers))
  console.log("Peers in the House: " + Object.values(peers).join(", "))
}

function checkStart(){
  console.log("Start signals: " + Object.values(peerStatus).join(", "))
  let startTag = ""
  let starting = true
  let vals = Object.values(peerStatus)
  for(v of vals){
    if(!v)
      starting = false
  }
  if(starting)
    startTag = "\nThe game is starting"
  return startTag
}