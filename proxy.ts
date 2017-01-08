import * as express from "express";
import { Server as WebSocketServer } from "uws";
import * as http from "http";
import * as net from "net";
import * as dgram from "dgram";
import fetch from "node-fetch";
import * as types from "./types";

const server = http.createServer();
const wss = new WebSocketServer({ server });
const app = express();

app.use("/", express.static(__dirname));

const toUrlHeaderName = "x-to-url";
const headersName = "x-headers";

app.all("/proxy", (request, proxyResponse) => {
    const url = request.header(toUrlHeaderName);
    if (!url) {
        proxyResponse.send(`No header: ${toUrlHeaderName}`);
    } else {
        const chunks: Buffer[] = [];
        request.on("data", chunk => {
            chunks.push(chunk as Buffer);
        });
        request.on("end", () => {
            const buffer = Buffer.concat(chunks);
            const headerArray: types.Header[] = JSON.parse(request.header(headersName));
            const headers: { [name: string]: string } = {};
            for (const header of headerArray) {
                headers[header.key] = header.value;
            }
            fetch(url, {
                headers,
                body: buffer,
                method: request.method,
            }).then(response => {
                response.text().then(body => {
                    proxyResponse.send(body);
                }, (error: Error) => {
                    proxyResponse.send(error.message);
                });
            }, (error: Error) => {
                proxyResponse.send(error.message);
            });
        });
    }
});

wss.on("connection", ws => {
    let tcpClient: net.Socket | undefined;
    const udpClient = dgram.createSocket("udp4");
    udpClient.on("message", (msg: Buffer, rinfo: dgram.AddressInfo) => {
        ws.send(msg);
    });

    ws.on("message", data => {
        const protocol: types.Protocol = JSON.parse(data);
        if (protocol.kind === "tcp:connect") {
            if (tcpClient) {
                tcpClient.destroy();
            }
            tcpClient = net.connect(protocol.port, protocol.host, () => {
                const responseProtocol: types.Protocol = {
                    kind: "tcp:connected",
                };
                ws.send(JSON.stringify(responseProtocol));
            });
            tcpClient.on("close", hadError => {
                const responseProtocol: types.Protocol = {
                    kind: "tcp:disconnected",
                };
                ws.send(JSON.stringify(responseProtocol));
            });
            tcpClient.on("error", error => {
                ws.send(`errored: ${error.stack}`);
            });
            tcpClient.on("timeout", () => {
                ws.send("timeout");
            });
            tcpClient.on("data", (tcpData: Buffer) => {
                ws.send(tcpData, { binary: true });
            });
        } else if (protocol.kind === "tcp:disconnect") {
            if (tcpClient) {
                tcpClient.destroy();
            }
        } else if (protocol.kind === "tcp:send") {
            if (tcpClient) {
                const message = protocol.isBinary ? new Buffer(protocol.message.split(",")) : protocol.message;
                tcpClient.write(message);
            }
        } else if (protocol.kind === "udp:send") {
            const message = protocol.isBinary ? new Buffer(protocol.message.split(",")) : protocol.message;
            udpClient.send(message, protocol.port, protocol.address);
        }
    });
});

server.on("request", app);

const port = 12345;
server.listen(port, () => {
    console.log(`The proxy is running, and listening: ${port}`);
});
