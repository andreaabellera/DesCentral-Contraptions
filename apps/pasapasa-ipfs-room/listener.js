/*
 * Simple Game Room
 *   A sample implementation of a peer-to-peer game room
 * 
 * listener.js
 *   A listener (acting server) for the game room
 * 
 * PROTOCOL LIST
 * 
 * If using a code editor, search up these I-codes (e.g. I2) to be directed to your desired section 
 * [PR1] Detection
 * [PR2] Naming
 * [PR3] Listing
 * [PR4] Starting
 */

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
  // Setup listener node
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

  // Start listen
  await node.start()
  console.log('Listening on ')
  node.multiaddrs.forEach((ma) => console.log(`${ma.toString()}/p2p/${node.peerId.toB58String()}`))


  /*=================
    [PR1]  DETECTION
    ==================*/

  // Detect new peer
  node.connectionManager.on('peer:connect', (connection) => {
    peerCount++
    let peerId = connection.remotePeer.toB58String()
    peers[peerId] = "New Player " + peerCount.toString()
    peerStatus[peerId] = false
    console.info(`Connected to ${peerId}!`)
    showPeers()

    // Add to record of peers
    let ma = new Multiaddr(`/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct/p2p/${peerId}`)
    peerMa.push(ma)
  })


  /*=================
    [PR2]  NAMING
    ==================*/

  // Update a dialer's nickname
  await node.handle('/update/1.0.0', async ({ connection, stream }) => {
    let name = await streamToConsole(stream)
    let peerId = connection.remotePeer.toB58String()
    console.log(peerId + " has changed nickname to " + name)
    let oldName = peers[peerId]
    peers[peerId] = name
    showPeers()
    
    // Notify all dialers with new peer nickname
    if(name){
      for(let ma of peerMa){
        const { stream } = await node.dialProtocol(ma, '/updateEcho/1.0.0')
        stdinToStream(stream,name + ";" + oldName) // For parsing: new name;old name
      }
    }


  /*=================
    [PR3]  LISTING
    ==================*/

    // Give players the list of current players in the game room
    for(let ma of peerMa){
      let { stream } = await node.dialProtocol(ma, '/getCurrPlayers/1.0.0')
      let peerList = Object.values(peers).join(";") // For parsing: p1;p2;p3;...;pn
      stdinToStream(stream,peerList)
    }
  })


  /*=================
    [PR4]  STARTING
    ==================*/

  // Receive start signal
  await node.handle('/start/1.0.0', async ({ connection, stream }) => {
    let signal = await streamToConsole(stream)
    let peerId = connection.remotePeer.toB58String()
    let tokens = signal.split(";")
    let name = tokens[0]
    let ready = tokens[1] == "true"
    let startEcho = name
    if(ready)
      startEcho += " is ready"
    else
      startEcho += " is not ready"

    peerStatus[peerId] = ready
    startEcho += checkStart()

    // Notify all dialers with peer's start signal
    for(let ma of peerMa){
      const { stream } = await node.dialProtocol(ma, '/startEcho/1.0.0')
      stdinToStream(stream,startEcho)
    }
  })

})()



/*=================
  CHECK PEER RECORD
  ==================*/


function showPeers(){
  //console.log(Object.keys(peers)) // Uncomment to see all hashed peer IDs
  console.log("Players in the Room: " + Object.values(peers).join(", "))
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