[![Dependency Status](https://david-dm.org/plantain-00/ws-tool.svg)](https://david-dm.org/plantain-00/ws-tool)
[![devDependency Status](https://david-dm.org/plantain-00/ws-tool/dev-status.svg)](https://david-dm.org/plantain-00/ws-tool#info=devDependencies)
[![Build Status](https://travis-ci.org/plantain-00/ws-tool.svg?branch=master)](https://travis-ci.org/plantain-00/ws-tool)

# ws-tool

A Develop Tool to Test WebSocket, Socket.IO, Stomp, HTTP, TCP, UDP API.

#### features

+ connect to a websocket, socket.io, stomp or TCP server
+ send and show raw or formatted messages(string or binary) recieved from the server
+ send and show HTTP request or UDP message
+ save your form automatically, or as bookmarks, and you can reuse it later

#### install

`git clone -b gh-pages https://github.com/plantain-00/ws-tool.git . --depth=1 && npm i --production`

if you want to test HTTP, TCP and UDP feature, you should enable the nodejs proxy with `node proxy.js`, then open `http://localhost:12345` in your browser.

otherwise, use a static file server(like nginx) to host the html,js,css files, then open `http://localhost:{your_static_file_server_listen_port}` in your browser.
