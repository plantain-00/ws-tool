import * as express from 'express'
const app = express()

const port = 9997

app.all('*', (request, response) => {
  console.log(request.method)
  console.log(request.headers)
  const chunks: Buffer[] = []
  request.on('data', chunk => {
    chunks.push(chunk as Buffer)
  })
  request.on('end', () => {
    const buffer = Buffer.concat(chunks)
    console.log(buffer)
    response.setHeader('x-a', 'b')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type')
    response.send(new Uint8Array([1, 2]))
  })
})

app.listen(port, () => {
  console.log(`Listening ${port}`)
})
