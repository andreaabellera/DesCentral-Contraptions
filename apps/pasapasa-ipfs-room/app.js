/*
 * Pasapasa
 *   A file sharing interface developed with IPFS
 * 
 * app.js
 *   All connection and event handler logic
 */

'use strict'

import { create } from 'ipfs-core'
const WebSockets = require('libp2p-websockets')
const filters = require('libp2p-websockets/src/filters')
const transportKey = WebSockets.prototype[Symbol.toStringTag]
const WebRTCDirect = require('libp2p-webrtc-direct')
const { Multiaddr } = require('multiaddr')
const Mplex = require('libp2p-mplex')
const { NOISE } = require('@chainsafe/libp2p-noise')
const Bootstrap = require('libp2p-bootstrap')
const { stdinToStream, streamToConsole } = require('./stream')

const App = () => {
  let username = "Guest"

  // Declare username
  document.getElementById("go").addEventListener("click", function() {
    let name = document.getElementById("namer").value
    if(name != "")
      username = name
    let buddyArray = document.getElementById("buddy-array")
    buddyArray.innerHTML += "<li>" + username + "</li>"
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
  

  let ipfs

  // Upload file to IPFS
  hardcodedPeerId = "bafybeihcyruaeza7uyjd6ugicbcrqumejf6uf353e5etdkhotqffwtguva"
  const store = async (name, content) => {
    if (!ipfs) {
      // Create IPFS node
      ipfs = await create({
        repo: 'ipfs-' + Math.random(),
        libp2p: {
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
                list: [`/ip4/127.0.0.1/tcp/5001`]
              }
            }
          }
        }
      })
      /*ipfs = await create({
        repo: 'ipfs-' + Math.random(),
        config: {
          Addresses: {
            Swarm: [
              `/ip4/127.0.0.1/tcp/5001/ipfs/${hardcodedPeerId}`
            ]
          },
          Bootstrap: []
        },
        libp2p: {
          config: {
            transport: {
              [transportKey]: {
                filter: filters.all
              }
            }
          }
        }
      })*/
    }

    const id = await ipfs.id()
    console.log("Connected to IPFS node: " + id.id)
    const fileToAdd = {
      path: `${name}`,
      content: content
    }
    console.log("Adding file: " + fileToAdd.path)
    const file = await ipfs.add(fileToAdd)
    console.log("File added to " + file.cid)
    console.log("Preview: https://ipfs.io/ipfs/" + file.cid)

    return file.cid
  }


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
        let fileId = await store(fileName, file)

        // Add file to shared interface
        addCard(fileName, fileId)
      }
    }
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
      if(imageFormats.includes(extension))
        previewDiv.style.backgroundImage = "url(https://ipfs.io/ipfs/" + fileId + ")"
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

}

App()
