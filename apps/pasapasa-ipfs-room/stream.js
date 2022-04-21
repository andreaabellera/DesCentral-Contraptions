/*
 * Simple Game Room
 *   A sample implementation of a peer-to-peer game room
 * 
 * stream.js
 *   Used for streaming or sending messages between nodes
 */

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
  return name
}

module.exports = {
  stdinToStream,
  streamToConsole
}
