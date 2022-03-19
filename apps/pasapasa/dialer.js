import 'babel-polyfill'
const Libp2p = require('libp2p')
const WebRTCDirect = require('libp2p-webrtc-direct')
const { Multiaddr } = require('multiaddr')
const Mplex = require('libp2p-mplex')
const { NOISE } = require('@chainsafe/libp2p-noise')
const Bootstrap = require('libp2p-bootstrap')
const { stdinToStream, streamToConsole } = require('./stream')
let currName = ""

document.addEventListener('DOMContentLoaded', async () => {
  // use the same peer id as in `listener.js` to avoid copy-pasting of listener's peer id into `peerDiscovery`
  const hardcodedPeerId = '12D3KooWCuo3MdXfMgaqpLC5Houi1TRoFqgK9aoxok4NK5udMu8m'
  const libp2p = await Libp2p.create({
    modules: {
      transport: [WebRTCDirect],
      streamMuxer: [Mplex],
      connEncryption: [NOISE],
      peerDiscovery: [Bootstrap]
    },
    config: {
      peerDiscovery: {
        [Bootstrap.tag]: {
          enabled: true,
          list: [`/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct/p2p/${hardcodedPeerId}`]
        }
      }
    }
  })

  const status = document.getElementById('status')
  const output = document.getElementById('output')

  output.textContent = ''

  function log (txt) {
    console.info(txt)
    output.textContent += `${txt.trim()}\n`
  }

  // Listen for new peers
  libp2p.on('peer:discovery', (peerId) => {
    log(`Found peer ${peerId.toB58String()}`)
  })

  // Listen for new connections to peers
  libp2p.connectionManager.on('peer:connect', (connection) => {
    log(`Connected to ${connection.remotePeer.toB58String()}`)
  })

  // Listen for peers disconnecting
  libp2p.connectionManager.on('peer:disconnect', (connection) => {
    log(`Disconnected from ${connection.remotePeer.toB58String()}`)
  })

  await libp2p.handle('/update/1.0.0', async ({ connection, stream }) => {
    let nameEcho = await streamToConsole(stream)
    log("User " + nameEcho + " has joined")
  })

  await libp2p.start()

  // Dial to the remote peer (the "listener")
  const listenerMa = new Multiaddr(`/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct/p2p/${hardcodedPeerId}`)

  status.innerHTML = 'Welcome to Wagone <br>Please enter a nickname'
  log(`Your id is ${libp2p.peerId.toB58String()}`)

  document.getElementById("update").addEventListener("click", function updateName(event) {
    const status = document.getElementById("status")
    let newName = document.getElementById("name").value
    if(newName != currName && newName.length > 0){
      currName = newName
      status.innerText = "Welcome " + newName
      update(newName)
    }
  });

  async function update(name) {
    const { stream } = await libp2p.dialProtocol(listenerMa, '/chat/1.0.0')
    stdinToStream(stream,name)
    let nameEcho = await streamToConsole(stream)
    log("User " + nameEcho + " has joined")
  }
})