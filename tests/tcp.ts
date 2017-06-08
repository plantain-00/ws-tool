import * as net from "net";

const port = 9999;
net.createServer(socket => {
    socket.on("data", data => {
        socket.write(data);
    });
}).listen(port);
// tslint:disable-next-line:no-console
console.log(`listening ${port}`);
