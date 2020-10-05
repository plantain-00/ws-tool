declare interface Window {
  RTCPeerConnection: RTCPeerConnection
}
declare interface RTCDataChannel {
  readyState: 'open' | 'close'
  onopen: () => void
  onclose: () => void
  onmessage: (event: MessageEvent<string | ArrayBuffer>) => void
  send(message: string): void
  close(): void
}
declare interface RTCPeerConnection {
  ondatachannel: (event: { channel: RTCDataChannel }) => void
  createDataChannel(channel: string): RTCDataChannel
}
declare class TextDecoder {
  constructor(encoding: string);
  public decode(typedArray: Uint8Array): string
}
