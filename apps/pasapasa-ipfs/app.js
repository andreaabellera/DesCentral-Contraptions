/*
 * Pasapasa IPFS
 *   A file sharing interface developed with IPFS
 * 
 * app.js
 *   Connect to a local IPFS node and add new files to the local node repository and the global IPFS core network.
 *   Users can download files from IPFS core network, view ipfs links in the browser, or view current files in the mutable file system.
 *   
 */

'use strict'

import { create } from 'ipfs-http-client'

const App = () => {
  let username = "Guest"
  let address = "http://127.0.0.1:5001"
  let fileStore = {}
  let ipfs = create(address)

  // Setup WebUI link
  document.getElementById("webui-linker").href = `${address}/webui/#/files`

  // Declare username
  document.getElementById("go").addEventListener("click", function() {
    let name = document.getElementById("namer").value
    if(name != "")
      username = name
    document.getElementById("app-name").innerText = username

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

    // Add file to IPFS
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
    let card = document.createElement("div")
    card.classList.add("card")
    
    if(fileId != "") { // Upload success, create file card
      let nameDiv = document.createElement("div")
      nameDiv.classList.add("filename")
      nameDiv.innerText = fileName
      card.appendChild(nameDiv)

      let previewDiv = document.createElement("div")
      previewDiv.classList.add("preview")
      let imageFormats = ["png", "jpg", "jpeg", "gif", "bmp"] // Add a preview image to card if photo
      let extension = fileName.split('.').pop()
      if(imageFormats.includes(extension)){
        previewDiv.style.backgroundImage = "url(https://ipfs.io/ipfs/" + fileId + ")"
      }
      card.appendChild(previewDiv)
      
      let viewBtn = document.createElement("button")
      viewBtn.classList.add("material-icons")
      viewBtn.innerText = "share"
      card.appendChild(viewBtn)

      // Visit global IPFS link
      viewBtn.addEventListener("click", () => {
        window.open("https://ipfs.io/ipfs/" + fileId, "_blank");
      });

      let downloadBtn = document.createElement("button")
      downloadBtn.classList.add("material-icons")
      downloadBtn.innerText = "system_update_alt"
      card.appendChild(downloadBtn)

      // Download from global ipfs link
      downloadBtn.addEventListener("click", function(e) {
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


  // Poll local node's Mutable File System per 1 second for existing and new files
  setInterval(async function() {
      const mfsFiles = []

      // Get file list
      for await (const file of ipfs.files.ls('/'))
          mfsFiles.push(file)

      // Add any new detected file to interface
      for (const file of mfsFiles) {
        if (!fileStore.hasOwnProperty(file.cid)) {
          console.log("File found: " + file.name)
          addCard(file.name, file.cid)
          fileStore[file.cid] = file.name
        }
      }
  }, 1000)

}

App()
