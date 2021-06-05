# ws-tool

[![Dependency Status](https://david-dm.org/plantain-00/ws-tool.svg)](https://david-dm.org/plantain-00/ws-tool)
[![devDependency Status](https://david-dm.org/plantain-00/ws-tool/dev-status.svg)](https://david-dm.org/plantain-00/ws-tool#info=devDependencies)
[![Build Status: Windows](https://ci.appveyor.com/api/projects/status/github/plantain-00/ws-tool?branch=master&svg=true)](https://ci.appveyor.com/project/plantain-00/ws-tool/branch/master)
![Github CI](https://github.com/plantain-00/ws-tool/workflows/Github%20CI/badge.svg)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fplantain-00%2Fws-tool%2Fmaster%2Fpackage.json)](https://github.com/plantain-00/ws-tool)

A Develop Tool to Test WebSocket, Socket.IO, Stomp, Bayeux, HTTP, TCP, UDP, WebRTC API.

## features

+ connect to a websocket, socket.io, stomp, bayeux or TCP server
+ send and show raw or formatted messages(string or binary) recieved from the server
+ send and show HTTP request or UDP message
+ save your form automatically, or as bookmarks, and you can reuse it later

## install

Just use the online one: [https://plantain-00.github.io/ws-tool/](https://plantain-00.github.io/ws-tool/)

Or host your own one by: `git clone https://github.com/plantain-00/ws-tool-release.git . --depth=1`

If you want to test HTTP, TCP and UDP feature, you should enable the nodejs proxy with `npm i --production && node proxy.js`, then open `http://localhost:12345` in your browser.

Otherwise, use a static file server(eg nginx) to host the html/js/css files, then open `http://localhost:{your_static_file_server_listen_port}` in your browser.

## docker

```bash
docker run -d -p 12345:12345 plantain/ws-tool
```
