# LibP2P Playground
## Overview
An environment for developing with the LibP2P library in Javascript. To create a new app, produce a new folder under [apps](/apps). For an exhaustive collection of documentation, references, and example apps with LibP2P, see the official [js-libp2p](https://github.com/libp2p/js-libp2p) Github repository.

## Setting Up
1. Clone this repository
2. At the root level, run the following command to install node packages.  
```npm install```

***LibP2P should now be enabled for all current and upcoming apps.***

## License
[MIT](LICENSE) © Protocol Labs  

# Apps
## Pasapasa
Pasapasa is a WONDERFUL DESCRIPTION. This sample demo app is developed by [andreaabellera](https://github.com/andreaabellera).  

**Additional Setup**
1. In the Pasapasa directory, run this to install a dependency.  
```npm install libp2p-webrtc-direct```

**Launching the App**
1. Open two terminals on the Pasapasa directory.
2. On the first terminal, enter this to start the Listener. The Listener will display connected peers and their activities in real-time.  
```node listener.js```
3. On the second terminal, enter this to start the localhost webserver.  
```npm run start```
4. Open any number of browser instances or tabs and type ```localhost:1234``` in the address bar. Each tab will be an individual player!

