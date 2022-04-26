# Pasapasa IPFS
A full environment for file sharing interface developed with [IPFS](https://ipfs.io/). This app is ideal for users taking a more intensive route to learning IPFS. For a limited version with minimal overhead environment setup, see [Pasapasa Lite](/apps/pasapasa-lite)  
Contributors: [andreaabellera](https://github.com/andreaabellera)

### Preview
![Pasapasa preview](/apps/pasapasa-ipfs/_pasapasa-preview_.gif)


## Launching the App
### Setup a Local IPFS Node
- As a first step, we want to setup a local IPFS node (called 'daemon') by installing the IPFS through the CLI distribution.
[Follow your OS-specific setup instructions in the IPFS documentation](https://docs.ipfs.io/install/command-line/#official-distributions)
- After installing IPFS, run your daemon on the terminal specified for your OS by entering `ipfs daemon`

### Connect to the local HTTP API
By default, IPFS sets the default API gateway on `http://127.0.0.1:5001`.
- If you plan to use **the same** gateway, skip this section. Your app should connect to IPFS automatically
- If you plan to set a **different** gateway or have the API listen on a different port, proceed to the following steps:
  1. After running `ipfs daemon` on your terminal, locate the WebUI address. Copy and paste into a browser to open a GUI for your node  
  2. On your WebUI's **Settings** tab, enter a new gateway for your API server or change the port number
  3. In **app.js**, locate the address variable on line 17  
  `let address = "http://127.0.0.1:5001"`
  4. Change the right-hand side of the variable called `address` into your new gateway's http address or multiaddress

### Launch the App
- On a terminal, enter the following command  
`npm start`
- After the app finishes building, open your site by entering `localhost:1234` in your browser's address bar

### Access the Mutable File System
- The WebUI or IPFS Desktop interfaces provide a quick and convenient way to access and manage the files served by your local node. Open the WebUI or [download the IPFS Desktop app](https://github.com/ipfs/ipfs-desktop/releases) to easily add, delete and share your IPFS files


## Troubleshooting
### CORS
If your app can't connect to the API due CORS issues, edit the `config` file located in your `.ipfs` folder and locate the API section as outlined below.
```
"API": {
    "HTTPHeaders": {}
}
```
Insert the following lines inside the HTTPHeaders to allow cross origin referencing.
```
"API": {
    "HTTPHeaders": {
      "Access-Control-Allow-Headers": [
        "X-Requested-With",
        "Range",
        "User-Agent"
      ],
      "Access-Control-Allow-Methods": [
        "GET", "POST"
      ],
      "Access-Control-Allow-Origin": [
        "*"
      ]
    }
}
```


