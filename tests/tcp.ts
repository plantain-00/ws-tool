import * as net from 'net'

const port = 9999
net.createServer(socket => {
  socket.on('data', data => {
    socket.write(data)
  })
}).listen(port)
console.log(`listening ${port}`)
