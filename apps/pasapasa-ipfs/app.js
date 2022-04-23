/*
 * Pasapasa
 *   A file sharing interface developed with IPFS
 * 
 * app.js
 *   All connection and event handler logic
 */

'use strict'

import { create } from 'ipfs-http-client'

const App = () => {
  let hardcodedPeerId = "bafybeihcyruaeza7uyjd6ugicbcrqumejf6uf353e5etdkhotqffwtguva"
  let username = "Guest"
  //let address = "/ip4/127.0.0.1/tcp/5001" // multiaddr (alternative)
  let address = "http://127.0.0.1:5001"
  let ipfs

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


  // Upload file to IPFS
  const store = async (name, content) => {
    if (!ipfs) {
      ipfs = create(address)
    }

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

    ;(async () => {
      console.log("ls test")
      const ls = await ipfs.files.ls('/')
      console.log(ls)
    })()
  }

}

App()
