'use strict'

export const enum ProtocolKind {
    tcpConnect = 'tcp:connect',
    tcpConnected = 'tcp:connected',
    tcpDisconnect = 'tcp:disconnect',
    tcpDisconnected = 'tcp:disconnected',
    tcpSend = 'tcp:send',
    udpSend = 'udp:send'
}

export type Protocol =
    {
      kind: ProtocolKind.tcpConnect;
      host: string;
      port: number;
    }
    |
    {
      kind: ProtocolKind.tcpConnected;
    }
    |
    {
      kind: ProtocolKind.tcpDisconnect;
    }
    |
    {
      kind: ProtocolKind.tcpDisconnected;
    }
    |
    {
      kind: ProtocolKind.tcpSend;
      isBinary: boolean;
      message: string;
    }
    |
    {
      kind: ProtocolKind.udpSend;
      address: string;
      port: number;
      isBinary: boolean;
      message: string;
    }

export type Header = {
  key: string;
  value: string;
}
