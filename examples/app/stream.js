'use strict'
/* eslint-disable no-console */

const pipe = require('it-pipe')
const lp = require('it-length-prefixed')

function stdinToStream(stream, message) {
  pipe(
    // Read from stdin (the source)
    message,
    // Encode with length prefix (so receiving side knows how much data is coming)
    lp.encode(),
    // Write to the stream (the sink)
    stream.sink
  )
}

async function streamToConsole(stream) {
  let src = stream.source
  lp.decode()
  let name = ""
  for await (const c of src){
    name += c.toString()[1]
  }
  /*pipe(
    stream.source,
    lp.decode(),
    async function (src) {
      for await (const msg of src)
        name += msg.toString()
      console.log("User " + name + " has joined")
    }
  )*/
  return name
}

module.exports = {
  stdinToStream,
  streamToConsole
}
