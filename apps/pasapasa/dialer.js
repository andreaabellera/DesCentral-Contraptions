import 'babel-polyfill'
const Libp2p = require('libp2p')
const WebRTCDirect = require('libp2p-webrtc-direct')
const { Multiaddr } = require('multiaddr')
const Mplex = require('libp2p-mplex')
const { NOISE } = require('@chainsafe/libp2p-noise')
const Bootstrap = require('libp2p-bootstrap')
const { stdinToStream, streamToConsole } = require('./stream')

let currName = ""
let starting = false

document.addEventListener('DOMContentLoaded', async () => {
  // Setup Node
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

  // Listen for new peers
  libp2p.on('peer:discovery', (peerId) => {
    //log(`Found peer ${peerId.toB58String()}`)
  })

  // Listen for new connections to peers
  libp2p.connectionManager.on('peer:connect', (connection) => {
    log(`Connected to ${connection.remotePeer.toB58String()}`)
  })

  // Listen for peers disconnecting
  libp2p.connectionManager.on('peer:disconnect', (connection) => {
    log(`Disconnected from ${connection.remotePeer.toB58String()}`)
  })

  // Update nickname
  await libp2p.handle('/update/1.0.0', async ({ stream }) => {
    let nameEcho = await streamToConsole(stream)
    log("Player " + nameEcho + " has joined")
  })

  // Show readies
  await libp2p.handle('/startEcho/1.0.0', async ({ stream }) => {
    let startEcho = await streamToConsole(stream)
    log(startEcho)
    let tokens = startEcho.split('\n')

    if(tokens.length == 2){ //The game is starting
      document.getElementById("ball").innerHTML = "<b>You have the ball</b>"
    }
  })

  // Start dial
  await libp2p.start()
  const listenerMa = new Multiaddr(`/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct/p2p/${hardcodedPeerId}`)


  //)*******************
  //)  GUI JAVASCRIPT
  //)*******************
  

  const header = document.getElementById("header")
  const output = document.getElementById("output")
  header.innerHTML = 'Please enter a nickname'
  log(`Your id is ${libp2p.peerId.toB58String()}`)
  
  // Output status updates to GUI
  output.textContent = ""
  function log (txt) {
    console.info(txt)
    output.textContent += `${txt.trim()}\n`
  }

  // Update nickname
  document.getElementById("update").addEventListener("click", function updateName(e) {
    const status = document.getElementById("header")
    let newName = document.getElementById("name").value
    if(newName != currName && newName.length > 0){
      currName = newName
      status.innerText = "Welcome " + newName
      document.getElementById("start").disabled = false
      update(newName)
    }
  });
  async function update(name) {
    const { stream } = await libp2p.dialProtocol(listenerMa, '/chat/1.0.0')
    stdinToStream(stream,name)
  }

  // Start
  document.getElementById("start").disabled = true
  document.getElementById("start").addEventListener("click", function signalStart(e) {
    start()
  });
  async function start() {
    starting = !starting
    const { stream } = await libp2p.dialProtocol(listenerMa, '/start/1.0.0')
    stdinToStream(stream, currName + " " + starting.toString())
  }
})