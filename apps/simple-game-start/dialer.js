/*
 * Simple Game Room
 *   An sample implementation of a peer-to-peer game room
 * 
 * dialer
 *   A dialer (acting client) for each browser player
 * 
 * PROTOCOL LIST
 * 
 * If using a code editor, search up these I-codes (e.g. I2) to be directed to your desired section 
 * [PR1] Detection
 * [PR2] Naming
 * [PR3] Listing
 * [PR4] Starting
 */

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
let players = []

document.addEventListener('DOMContentLoaded', async () => {
  // Setup Player Node
  const hardcodedPeerId = '12D3KooWCuo3MdXfMgaqpLC5Houi1TRoFqgK9aoxok4NK5udMu8m'
  const node = await Libp2p.create({
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

  // Start dial
  await node.start()
  const listenerMa = new Multiaddr(`/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct/p2p/${hardcodedPeerId}`)


  /*=================
    WINDOW UI SETUP
    ==================*/

  const header = document.getElementById("header")
  const output = document.getElementById("output")
  header.innerHTML = 'Enter a nickname to join'
  console.log(`Your peer id is ${node.peerId.toB58String()}`)
  
  // Show new message to window and console
  function log (txt) {
    console.info(txt)
    output.textContent += `${txt.trim()}\n`
  }


  /*=================
    [PR1]  DETECTION
    ==================*/

  // Notify listener connection
  node.connectionManager.on('peer:connect', (connection) => {
    log(`Connected to listener! Listener ID is ${connection.remotePeer.toB58String()}`)
  })

  // Notify listener disconnection
  node.connectionManager.on('peer:disconnect', (connection) => {
    log(`Disconnected from listener`)
  })


  /*=================
    [PR2]  NAMING
    ==================*/

  // Name update handler
  document.getElementById("update").addEventListener("click", function updateName(e) {
    const header = document.getElementById("header")
    let newName = document.getElementById("name").value
    if(players.includes(newName))
      header.innerHTML = 'Nickname already taken. Enter a new nickname'
    else if(newName.length == 0)
      header.innerHTML = 'Nickname cannot be empty. Enter a new nickname'
    else{
      currName = newName
      header.innerText = "Welcome " + newName
      document.getElementById("start").disabled = false
      requestUpdate(newName)
    }
  })

  // Update name of player
  async function requestUpdate(name) {
    const { stream } = await node.dialProtocol(listenerMa, '/update/1.0.0')
    stdinToStream(stream,name)
  }

  // Receive nickname updates
  await node.handle('/updateEcho/1.0.0', async ({ stream }) => {
    let nameEcho = await streamToConsole(stream)
    let toks = nameEcho.split(';') 
    log(toks[1] + " updated name to " + toks[0])
  })


  /*=================
    [PR3]  LISTING
    ==================*/
  
  // Get updated player list
  await node.handle('/getCurrPlayers/1.0.0', async ({ stream }) => {
    let currPlayerEcho = await streamToConsole(stream)
    let currPlayers = currPlayerEcho.split(';')
    log("Current players:")
    players = []
    for(let player of currPlayers) {
      players.push(player)
      log(player)
    }
  })


  /*=================
    [PR4]  STARTING
    ==================*/

  // Start handler
  document.getElementById("start").disabled = true
  document.getElementById("start").addEventListener("click", function signalStart(e) {
    start()
  })
  
  // Toggle ready or not ready for player
  async function start() {
    starting = !starting
    const { stream } = await node.dialProtocol(listenerMa, '/start/1.0.0')
    stdinToStream(stream, currName + ";" + starting.toString()) // For parsing: player name;ready signal
  }

  // Receive start status update of a player
  await node.handle('/startEcho/1.0.0', async ({ stream }) => {
    let startEcho = await streamToConsole(stream)
    log(startEcho)
    let tokens = startEcho.split('\n')

    if(tokens.length == 2){
      document.getElementById("game").innerHTML = "<b> All players are ready. Game is starting! </b>"
    }
  })

})