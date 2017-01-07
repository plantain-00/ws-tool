import * as express from "express";
import { Server as WebSocketServer } from "uws";
import * as http from "http";
import * as net from "net";
import * as dgram from "dgram";
import * as types from "./types";

const server = http.createServer();
const wss = new WebSocketServer({ server });
const app = express();

app.use("/", express.static(__dirname));

wss.on("connection", ws => {
    let tcpClient: net.Socket | undefined;
    let udpClient: dgram.Socket;
    let udpPort: number | undefined;
    let udpAddress: string | undefined;
    ws.on("message", (data: string | ArrayBuffer) => {
        if (typeof data !== "string") {
            const buffer = new Buffer(data);
            if (tcpClient) {
                tcpClient.write(buffer);
            }
            if (udpClient && udpPort && udpAddress) {
                udpClient.send(buffer, udpPort, udpAddress);
            }
        } else {
            const protocol: types.Protocol = JSON.parse(data);
            if (protocol.kind === "tcp:connect") {
                if (tcpClient) {
                    tcpClient.destroy();
                }
                tcpClient = net.connect(protocol.port, protocol.host, () => {
                    const protocol: types.Protocol = {
                        kind: "tcp:connected",
                    };
                    ws.send(JSON.stringify(protocol));
                });
                tcpClient.on("close", hadError => {
                    const protocol: types.Protocol = {
                        kind: "tcp:disconnected",
                    };
                    ws.send(JSON.stringify(protocol));
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
                    tcpClient.write(protocol.message);
                }
            } else if (protocol.kind === "udp:config") {
                if (udpClient) {
                    udpClient.close();
                }
                udpClient = dgram.createSocket("udp4");
                udpPort = protocol.port;
                udpAddress = protocol.address;
                udpClient.on("message", (msg, rinfo) => {
                    ws.send(msg);
                });
            } else if (protocol.kind === "udp:send") {
                if (udpClient && udpPort && udpAddress) {
                    udpClient.send(protocol.message, udpPort, udpAddress);
                }
            }
        }
    });
});

server.on("request", app);

const port = 12345;
server.listen(port, () => {
    console.log(`The proxy is running, and listening: ${port}`);
});
