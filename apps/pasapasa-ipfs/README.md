# Pasapasa IPFS
A full environment for file sharing interface developed with [IPFS](https://ipfs.io/). This app is ideal for users taking a more intensive route to learning IPFS. For a limited version with minimal overhead environment setup, see [Pasapasa Lite](/apps/pasapasa-lite)  
Contributors: [andreaabellera](https://github.com/andreaabellera)

### Preview
![Pasapasa preview](/apps/pasapasa-ipfs/_pasapasa-preview_.gif)

### TODO: Launching the App
- Setting up a local IPFS node (called 'daemon') through the CLI
- Connecting to the local HTTP API
- Run commands
- Accessing the local Mutable File System (MFS)
- View your MFS through a WebUI or IPFS' Desktop GUI



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


