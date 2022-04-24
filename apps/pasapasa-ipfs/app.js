/*
 * Pasapasa IPFS
 *   A file sharing interface developed with IPFS
 * 
 * app.js
 *   All connection and event handler logic
 */

'use strict'

import { create } from 'ipfs-http-client'
const Libp2p = require('libp2p')
const WebRTCDirect = require('libp2p-webrtc-direct')
const { Multiaddr } = require('multiaddr')
const Mplex = require('libp2p-mplex')
const { NOISE } = require('@chainsafe/libp2p-noise')
const Bootstrap = require('libp2p-bootstrap')
const { stdinToStream, streamToConsole } = require('./stream')

const App = () => {
  let username = "Guest"
  /*let peerNames = []
  let peers = {}
  let peerMa = []*/
  let lAddress // LibP2P listener address
  let address = "http://127.0.0.1:5001" // IPFS address
  let fileStore = {}
  let ipfs = create(address)
  let libp2p

  // Setup WebUI link
  document.getElementById("webui-linker").href = `${address}/webui/#/files`

  // Declare username
  document.getElementById("go").addEventListener("click", function() {
    let name = document.getElementById("namer").value
    if(name != "")
      username = name
    document.getElementById("app-name").innerText = username

    
    // Append name to buddy list
    let buddyArray = document.getElementById("buddy-array")
    buddyArray.innerHTML += "<li>" + username + "</li>"
    
    // Send buddy name to listener
    ;(async () => {
      const { stream } = await libp2p.dialProtocol(lAddress, '/join/1.0.0')
      stdinToStream(stream, username)
    })()

    // Interface change animation
    let start = document.getElementById("start");
    let content = document.getElementById("content");
    let view = document.getElementById("view");
    view.removeChild(document.getElementById("arrowee"));
    var id = setInterval(frame, 20);
    var pos = 13;
    function frame() {
        if (pos < -6) {
            clearInterval(id);
            view.removeChild(start);
        } else {
            pos-=2;
            start.style.marginTop = pos + "vh";
            start.style.opacity = pos * 0.1;
            content.style.opacity = pos * -0.1;
        }
    }
  })

  // Add a new file to the interface
  document.getElementById("add-file").onclick = async (e) => {
    e.preventDefault()

    // Get client file upload
    let uploader = document.getElementById("uploader")
    let files = uploader.files
    if (files.length > 0) {
      for(let file of files){
        let name = file.name
        console.log("Uploaded file: " + name)
        let fileName = name.replace(/^.*[\\\/]/, '') // Remove fakepath
        
        // Upload to IPFS
        await store(fileName, file)
      }
    }
  }


  // Upload file to IPFS
  const store = async (name, content) => {
    const id = await ipfs.id()
    console.log("Connected to IPFS node: " + id.id)
    const fileToAdd = {
      path: `${name}`,
      content: content
    }
    console.log("Adding file: " + fileToAdd.path)
    const file = await ipfs.add(fileToAdd) // Add file to global IPFS
    await ipfs.files.write(`/${name}`, content, {create: true}) // Add file to local node (see localhost:5001/webui/#/files)
    console.log("File added to " + file.cid)
    console.log(`Preview: https://ipfs.io/ipfs/${file.cid}`)

    return file.cid
  }
    
    
  // Add new file entry to interface
  function addCard(fileName, fileId) {  
    let fileArray = document.getElementById("file-array")
    let card = document.createElement("button")
    card.classList.add("card")
    
    if(fileId != "") { // Upload success
      let nameDiv = document.createElement("div")
      nameDiv.classList.add("filename")
      nameDiv.innerText = fileName
      card.appendChild(nameDiv)

      let previewDiv = document.createElement("div")
      previewDiv.classList.add("preview")
      let imageFormats = ["png", "jpg", "jpeg", "gif", "bmp"]
      let extension = fileName.split('.').pop()
      if(imageFormats.includes(extension)){
        previewDiv.style.backgroundImage = "url(https://ipfs.io/ipfs/" + fileId + ")"
      }
      card.appendChild(previewDiv)
      
      let downloadIcon = document.createElement("div")
      downloadIcon.classList.add("material-icons")
      downloadIcon.innerText = "system_update_alt"
      card.appendChild(downloadIcon)

      card.addEventListener("click", function(e) {
        console.log("Downloading " + fileName)
        axios({
            url: "https://ipfs.io/ipfs/" + fileId,
            method: 'GET',
            responseType: 'blob'
        })
        .then((response) => {
                const url = window.URL
                    .createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', "pasapasa_" + fileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
        })
      })
    }
    else 
      card.innerHTML = `<div class="filename"> Failed to upload file '${fileName}' </div>`
    console.log("File id is " + fileId)
    fileArray.appendChild(card)
  }

  // Poll Mutable File System per second for existing and new files
  setInterval(async function() {
      const mfsFiles = []

      for await (const file of ipfs.files.ls('/'))
          mfsFiles.push(file)

      for (const file of mfsFiles) {
        if (!fileStore.hasOwnProperty(file.cid)) {
          console.log("File found: " + file.name)
          addCard(file.name, file.cid)
          fileStore[file.cid] = file.name
        }
      }
  }, 1000)

  
  // LibP2P Operations
  ;(async () => {
    // Obsolete: Cannot make the public server no listener route work
    /*
    libp2p = await Libp2p.create({
      addresses: {
        listen: [ // Cannot set it up locally with IPFS. Out of desperation, I'm using a public server
          '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
        ],
      },
      modules: {
        transport: [Websockets, WebRTCStar],
        connEncryption: [NOISE],
        streamMuxer: [Mplex],
        peerDiscovery: [Bootstrap]
      },
      config: {
        peerDiscovery: {
          [Bootstrap.tag]: {
            enabled: true,
            list: [
              '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
              '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
            ]
          }
        }
      }
    })
    libp2p.on('peer:discovery', (peer) => {
      let peerId = peer.toB58String()
      let ma = new Multiaddr(`/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/p2p/${peerId}`)
      peers[peerId] = ma
    })
    await libp2p.handle('/pasapasaname/1.0.0', async ({ stream }) => {
      let name = await streamToConsole(stream)
      peerNames.push(name)
      console.log("Yay")
      console.log(`Peer ${name} connected`)
    })
    */

    // Create LibP2P node
    const hardcodedPeerId = '12D3KooWCuo3MdXfMgaqpLC5Houi1TRoFqgK9aoxok4NK5udMu8m'
    libp2p = await Libp2p.create({
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
            list: [`/ip4/127.0.0.1/tcp/12345/http/p2p-webrtc-direct/p2p/${hardcodedPeerId}`]
          }
        }
      }
    })

    // Detect connection
    libp2p.connectionManager.on('peer:connect', (connection) => {
      console.log(`Connected to LibP2P listener: ${connection.remotePeer.toB58String()}`)
    })

    // Receive join updates
    await libp2p.handle('/joinRelay/1.0.0', async ({ stream }) => {
      let buddyName = await streamToConsole(stream)
      let buddyArray = document.getElementById("buddy-array")
      buddyArray.innerHTML += `<li class="joined"> ${buddyName} has joined the room </li>`
    })

    // Receive chat updates
    await libp2p.handle('/chatRelay/1.0.0', async ({ stream }) => {
      let message = await streamToConsole(stream)
      let buddyArray = document.getElementById("buddy-array")
      buddyArray.innerHTML += `<li>${message}</li>`
    })
  
    await libp2p.start()
    lAddress = new Multiaddr(`/ip4/127.0.0.1/tcp/12345/http/p2p-webrtc-direct/p2p/${hardcodedPeerId}`)
    console.log(`LibP2P id is ${libp2p.peerId.toB58String()}`)

  })()

}

App()
