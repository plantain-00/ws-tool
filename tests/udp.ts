import * as dgram from 'dgram'

const port = 9998
const server = dgram.createSocket('udp4')
server.on('message', (msg, rinfo) => {
  server.send(msg, rinfo.port, rinfo.address)
})
server.bind(port)
console.log(`listening ${port}`)
