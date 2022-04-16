# Simple Game Room
A simple implementation of a peer-to-peer game room  
Contributors: [andreaabellera](https://github.com/andreaabellera)  

**Setup**
1. Open a terminal on this directory, and run this to install a dependency  
```npm install libp2p-webrtc-direct```

**Launching the App**
2. Open another terminal on this directory. You should have two terminals open
3. On the first terminal, enter this to start the Listener. The Listener will display connected peers and their activities in real-time  
`node listener.js`
4. On the second terminal, enter this to start the localhost webserver  
`npm run start`
5. Open any number of browser instances or tabs and type `localhost:1234` in the address bar. Each tab will be an individual player!