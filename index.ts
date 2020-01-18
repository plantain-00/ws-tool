import Vue, { ComponentOptions } from 'vue'
import Component from 'vue-class-component'
import { Decoder } from 'socket.io-parser'
import Clipboard from 'clipboard'
import * as protobuf from 'protobufjs'
import DNSMessage from 'dns-protocol/browser'
import * as types from './types'
import { appTemplateHtml, appTemplateHtmlStatic } from './variables'

new Clipboard('.clipboard')
let pingId: NodeJS.Timer
const decoder = new Decoder()
const previewDecoder = new Decoder()
const parameters = localStorage.getItem('parameters')
const headers = localStorage.getItem('headers')
const bookmarks = localStorage.getItem('bookmarks')
let proxyWebSocket: WebSocket
const toUrlHeaderName = 'x-to-url'
const headersName = 'x-headers'

function formatTimeNumber(num: number) {
  return num < 10 ? '0' + num : num.toString()
}

function getNow() {
  return `${formatTimeNumber(new Date().getHours())}:${formatTimeNumber(new Date().getMinutes())}:${formatTimeNumber(new Date().getSeconds())}`
}

type Parameter = {
  key: string;
  value: string;
}

type FormData = {
  key: string;
  value: string | File;
  type: 'text' | 'file';
}

type Bookmark = {
  name: string;
  isSocketIO: boolean;
  ignorePing: boolean;
  baseUrl: string;
  parameters: Parameter[];
  anchor: string;
  message: string;
  showRaw: boolean;
  showFormatted: boolean;
  subprotocol: string;
  protobufContent: string;
  protobufTypePath: string;
  messageType: string;
  protocol: string;
  host: string;
  port: number;
  httpMethod: string;
  headers: types.Header[];
  dnsQuestionName: string;
  dnsTransactionId: number;
}

type Message = {
  moment: string;
  type: string;
  reason?: string;
  data?: string;
  tips?: string;
  rawData?: string;
  formattedData?: string;
  visible?: boolean;
  visibilityButtonExtraBottom?: number;
  isBinary?: boolean;
  id: number;
}

const stompConnectionMessage = `CONNECT
login:admin
passcode:admin
accept-version:1.2,1.1,1.0
heart-beat:0,0

\0`

const stompSubscriptionMessage = `SUBSCRIBE
id:sub-0
destination:/topic/test_topic

\0`

const stompSendMessage = `SEND
destination:/queue/test
content-type:text/plain

hello queue test
\0`

const socketIOSendMessage = `42["a_event",{
    "a_key":"a_value"
}]`

const bayeuxHandshakeMessage = `[{
    "advice":{ "timeout":60000, "interval":0 },
    "channel":"/meta/handshake",
    "ext":{},
    "id":"1",
    "minimumVersion": "0.9",
    "supportedConnectionTypes": ["websocket"],
    "version": "1.0"
}]`

const bayeuxSubscribeMessage = `[{
    "channel": "/meta/subscribe",
    "clientId": "",
    "id": "2",
    "subscription": "/test_channel"
}]`

const bayeuxPublishMessage = `[{
    "channel": "/test_channel",
    "clientId": "",
    "data": {},
    "id": "3"
}]`

const bayeuxPingMessage = `[{
    "advice": { "timeout": 0 },
    "channel": "/meta/connect",
    "clientId": "",
    "connectionType": "websocket",
    "id": "4"
}]`

const defaultProtobufContent = `package testPackage;
syntax = "proto3";
message Test {
    required string data = 1;
}`

type DataChannelStatus = 'none' | 'init' | 'created offer' | 'answered offer' | 'set answer'

@Component({
  render: appTemplateHtml,
  staticRenderFns: appTemplateHtmlStatic
})
export class App extends Vue {
  messages: Message[] = []
  parameters: Parameter[] = parameters ? JSON.parse(parameters) : [{ key: 'transport', value: 'websocket' }, { key: 'room', value: 'test' }]
  previewResult = ''
  isPreview = false
  bookmarks: Bookmark[] = bookmarks ? JSON.parse(bookmarks) : []
  isEditing = false
  bookmarkName = ''
  filter = ''
  filterIsHidden = true
  stompIsHidden = true
  protobufIsHidden = true
  dnsIsHidden = true
  headers: types.Header[] = headers ? JSON.parse(headers) : [{ key: 'Content-Type', value: 'application/json' }]
  socketIOIsHidden = true
  formDatas: FormData[] = []
  peerConnection = window.RTCPeerConnection ? new RTCPeerConnection({}) : null
  dataChannelName = 'my_test_channel'
  sessionDescription = ''
  dataChannelStatus: DataChannelStatus = 'none'
  id = 1
  bayeuxIsHidden = true
  useProxy = true
  private protobufType: protobuf.Type | null = null
  private dataChannel: RTCDataChannel | null = null
  private websocket: WebSocket | null = null
  private isSocketIOInternally = !!localStorage.getItem('isSocketIO')
  private ignorePingInternally = !!localStorage.getItem('ignorePing')
  private baseUrl: string = localStorage.getItem('baseUrl') || 'wss://copy.yorkyao.com/socket.io/'
  private anchor: string = localStorage.getItem('anchor') || ''
  private messageInternally: string = localStorage.getItem('message') || '42["copy",{"username":"hello","message":"world"}]'
  private showRawInternally = !!localStorage.getItem('showRaw')
  private showFormattedInternally = !!localStorage.getItem('showFormatted')
  private subprotocolInternally = localStorage.getItem('subprotocol') || ''
  private protobufContentInternally = localStorage.getItem('protobufContent') || defaultProtobufContent
  private protobufTypePathInternally = localStorage.getItem('protobufTypePath') || 'testPackage.Test'
  private dnsTransactionIdInternally = +localStorage.getItem('dnsTransactionId')! || 43825
  private dnsQuestionNameInternally = localStorage.getItem('dnsQuestionName') || 'www.example.com'
  private messageTypeInternally = localStorage.getItem('messageType') || 'string'
  private protocolInternally = localStorage.getItem('protocol') || 'WebSocket'
  private hostInternally = localStorage.getItem('host') || 'localhost'
  private portInternally = +localStorage.getItem('port')! || 9999
  private tcpConnected = false
  private httpMethodInternally = localStorage.getItem('httpMethod') || 'GET'
  private isDataChannelConnected = false

  constructor(options?: ComponentOptions<Vue>) {
    super(options)
    if (this.peerConnection) {
      this.peerConnection.ondatachannel = event => {
        event.channel.onopen = e => {
          app.isDataChannelConnected = true
          this.messages.unshift({
            moment: getNow(),
            type: 'tips',
            tips: 'peer connection opened.',
            id: app.id++
          })
        }
        event.channel.onclose = e => {
          app.isDataChannelConnected = false
          this.messages.unshift({
            moment: getNow(),
            type: 'tips',
            tips: 'peer connection closed.',
            id: app.id++
          })
        }
        event.channel.onmessage = e => {
          this.onmessage(e)
        }
      }
    }
  }

  get httpMethod() {
    return this.httpMethodInternally
  }
  set httpMethod(value: string) {
    localStorage.setItem('httpMethod', value)
    this.httpMethodInternally = value
  }
  get host() {
    return this.hostInternally
  }
  set host(value: string) {
    localStorage.setItem('host', value)
    this.hostInternally = value
  }
  get port() {
    return this.portInternally
  }
  set port(value: number) {
    localStorage.setItem('port', String(value))
    this.portInternally = value
  }
  get protocol() {
    return this.protocolInternally
  }
  set protocol(value: string) {
    if (value === 'HTTP' || this.messageType === 'FormData') {
      this.messageType = 'string'
    }
    localStorage.setItem('protocol', value)
    this.protocolInternally = value
  }
  get messageType() {
    return this.messageTypeInternally
  }
  set messageType(value: string) {
    localStorage.setItem('messageType', value)
    this.messageTypeInternally = value
  }
  get protobufContent() {
    return this.protobufContentInternally
  }
  set protobufContent(value: string) {
    localStorage.setItem('protobufContent', value)
    this.protobufContentInternally = value
  }
  get protobufTypePath() {
    return this.protobufTypePathInternally
  }
  set protobufTypePath(value: string) {
    localStorage.setItem('protobufTypePath', value)
    this.protobufTypePathInternally = value
  }
  get dnsTransactionId() {
    return this.dnsTransactionIdInternally
  }
  set dnsTransactionId(value: number) {
    localStorage.setItem('dnsTransactionId', value.toString())
    this.dnsTransactionIdInternally = value
  }
  get dnsQuestionName() {
    return this.dnsQuestionNameInternally
  }
  set dnsQuestionName(value: string) {
    localStorage.setItem('dnsQuestionName', value.toString())
    this.dnsQuestionNameInternally = value
  }
  get filteredMessages() {
    return this.messages.filter(m => {
      if (this.filter) {
        return (typeof m.rawData === 'string' && m.rawData.indexOf(this.filter) !== -1)
          || (typeof m.moment === 'string' && m.moment.indexOf(this.filter) !== -1)
          || (typeof m.formattedData === 'string' && m.formattedData.indexOf(this.filter) !== -1)
          || (typeof m.type === 'string' && m.type.indexOf(this.filter) !== -1)
          || (typeof m.reason === 'string' && m.reason.indexOf(this.filter) !== -1)
          || (typeof m.data === 'string' && m.data.indexOf(this.filter) !== -1)
          || (typeof m.tips === 'string' && m.tips.indexOf(this.filter) !== -1)
      } else {
        return true
      }
    }).slice(0, 100)
  }
  get subprotocol() {
    return this.subprotocolInternally
  }
  set subprotocol(value) {
    localStorage.setItem('subprotocol', value)
    this.subprotocolInternally = value
  }
  get canSaveAsBookmark() {
    if (this.bookmarkName.trim() === '') {
      return false
    }
    for (const bookmark of this.bookmarks) {
      if (bookmark.name === this.bookmarkName) {
        return false
      }
    }
    return true
  }
  get isSocketIO() {
    return this.isSocketIOInternally
  }
  set isSocketIO(value) {
    localStorage.setItem('isSocketIO', value ? '1' : '')
    this.isSocketIOInternally = value
  }
  get ignorePing() {
    return this.ignorePingInternally
  }
  set ignorePing(value) {
    localStorage.setItem('ignorePing', value ? '1' : '')
    this.ignorePingInternally = value
  }
  get showRaw() {
    return this.showRawInternally
  }
  set showRaw(value) {
    localStorage.setItem('showRaw', value ? '1' : '')
    this.showRawInternally = value
  }
  get showFormatted() {
    return this.showFormattedInternally
  }
  set showFormatted(value) {
    localStorage.setItem('showFormatted', value ? '1' : '')
    this.showFormattedInternally = value
  }
  get message() {
    return this.messageInternally
  }
  set message(value) {
    localStorage.setItem('message', value)
    this.messageInternally = value
  }
  get url() {
    let url = this.baseUrl
    if (this.parameters.length > 0) {
      url += '?'
      for (const parameter of this.parameters) {
        url += parameter.key + '=' + parameter.value + '&'
      }
      url = url.substring(0, url.length - 1)
    }
    if (this.anchor) {
      url += '#' + this.anchor
    }
    return url
  }
  set url(value) {
    let index = value.indexOf('#')
    if (index > -1) {
      value = value.substring(0, index)
      this.anchor = value.substring(index + 1)
    } else {
      this.anchor = ''
    }

    index = value.indexOf('?')
    if (index > -1) {
      this.baseUrl = value.substring(0, index)
      const array = value.substring(index + 1).split('&')
      const newParameters: Parameter[] = []
      for (const tmp of array) {
        index = tmp.indexOf('=')
        if (index === -1) {
          newParameters.push({
            key: tmp,
            value: ''
          })
        } else {
          newParameters.push({
            key: tmp.substring(0, index),
            value: tmp.substring(index + 1)
          })
        }
      }
      this.parameters = newParameters
    } else {
      this.baseUrl = value
      this.parameters = []
    }

    localStorage.setItem('baseUrl', this.baseUrl)
    localStorage.setItem('parameters', JSON.stringify(this.parameters))
    localStorage.setItem('anchor', this.anchor)
  }
  get isConnected() {
    return (this.protocol === 'WebSocket' && this.websocket)
      || (this.protocol === 'TCP' && this.tcpConnected)
      || (this.protocol === 'WebRTC' && this.dataChannel && this.isDataChannelConnected)
  }
  get isDisconnected() {
    return (this.protocol === 'WebSocket' && !this.websocket)
      || (this.protocol === 'TCP' && !this.tcpConnected)
      || (this.protocol === 'WebRTC' && !(this.dataChannel && this.isDataChannelConnected))
  }
  get shouldContainBody() {
    return this.httpMethod === 'POST'
      || this.httpMethod === 'PUT'
      || this.httpMethod === 'PATCH'
      || this.httpMethod === 'DELETE'
      || this.httpMethod === 'LINK'
      || this.httpMethod === 'UNLINK'
  }
  get shouldShowMessageTextarea() {
    return (this.messageType === 'string' || this.protocol !== 'HTTP') && this.dnsIsHidden
  }
  createDataChannel() {
    if (!this.peerConnection) {
      return
    }
    this.dataChannel = this.peerConnection.createDataChannel(this.dataChannelName)
    this.dataChannelStatus = 'init'
    this.messages.unshift({
      moment: getNow(),
      type: 'tips',
      tips: `create data channel successfully: ${this.dataChannelName}`,
      id: this.id++
    })
  }
  createOffer() {
    if (!this.peerConnection) {
      return
    }
    this.peerConnection.createOffer()
      .then(offer => this.peerConnection!.setLocalDescription(offer))
      .then(() => {
        this.showLocalDescription()
        this.dataChannelStatus = 'created offer'
      }, (error: Error) => {
        this.showError(error)
      })
  }
  answerOffer() {
    if (!this.peerConnection) {
      return
    }
    try {
      const offer = new RTCSessionDescription(JSON.parse(this.sessionDescription))
      this.peerConnection.setRemoteDescription(offer as any)
        .then(() => this.peerConnection!.createAnswer())
        .then(answer => this.peerConnection!.setLocalDescription(answer as any))
        .then(() => {
          this.showLocalDescription()
          this.dataChannelStatus = 'answered offer'
        }, (error: Error) => {
          this.showError(error)
        })
    } catch (error) {
      this.showError(error)
    }
  }
  setAnswer() {
    if (!this.peerConnection) {
      return
    }
    try {
      const answer = new RTCSessionDescription(JSON.parse(this.sessionDescription))
      this.peerConnection.setRemoteDescription(answer as any)
        .then(() => {
          this.messages.unshift({
            moment: getNow(),
            type: 'tips',
            tips: 'set answer successfully.',
            id: this.id++
          })
          this.dataChannelStatus = 'set answer'
        }, (error: Error) => {
          this.showError(error)
        })
    } catch (error) {
      this.messages.unshift({
        moment: getNow(),
        type: 'error',
        reason: error.message,
        id: this.id++
      })
    }
  }
  loadProtobuf() {
    if (this.protobufContent && this.protobufTypePath) {
      try {
        this.protobufType = protobuf.parse(this.protobufContent).root.lookup(this.protobufTypePath) as protobuf.Type
        this.messages.unshift({
          moment: getNow(),
          type: 'tips',
          tips: 'The protobuf definitions is loaded successfully.',
          id: this.id++
        })
      } catch (error) {
        this.messages.unshift({
          moment: getNow(),
          type: 'error',
          reason: error.message,
          id: this.id++
        })
      }
    }
  }
  savingAsBookmark() {
    this.isEditing = !this.isEditing
    Vue.nextTick(() => {
      const bookmarkNameElement = this.$refs.bookmarkName as HTMLElement
      if (bookmarkNameElement) {
        bookmarkNameElement.focus()
      }
    })
  }
  toggleFilter() {
    this.filterIsHidden = !this.filterIsHidden
    Vue.nextTick(() => {
      const filterElement = this.$refs.filter as HTMLElement
      if (filterElement) {
        filterElement.focus()
      }
    })
  }
  toggleSocketIO() {
    this.socketIOIsHidden = !this.socketIOIsHidden
  }
  toggleStomp() {
    this.stompIsHidden = !this.stompIsHidden
  }
  toggleBayeux() {
    this.bayeuxIsHidden = !this.bayeuxIsHidden
  }
  toggleProtobuf() {
    this.protobufIsHidden = !this.protobufIsHidden
  }
  toggleDNS() {
    this.dnsIsHidden = !this.dnsIsHidden
  }
  saveAsBookmark() {
    this.isEditing = false
    this.bookmarks.unshift({
      name: this.bookmarkName,
      isSocketIO: this.isSocketIO,
      ignorePing: this.ignorePing,
      baseUrl: this.baseUrl,
      parameters: this.parameters,
      anchor: this.anchor,
      message: this.message,
      showRaw: this.showRaw,
      showFormatted: this.showFormatted,
      subprotocol: this.subprotocol,
      protobufContent: this.protobufContent,
      protobufTypePath: this.protobufTypePath,
      messageType: this.messageType,
      protocol: this.protocol,
      host: this.host,
      port: this.port,
      httpMethod: this.httpMethod,
      headers: this.headers,
      dnsTransactionId: this.dnsTransactionId,
      dnsQuestionName: this.dnsQuestionName
    })
    localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks))
  }
  deleteBookmark(index: number) {
    this.bookmarks.splice(index, 1)
    localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks))
  }
  useBookmark(index: number) {
    const bookmark = this.bookmarks[index]
    this.isSocketIO = bookmark.isSocketIO
    this.ignorePing = bookmark.ignorePing
    this.showRaw = bookmark.showRaw
    this.showFormatted = bookmark.showFormatted
    this.message = bookmark.message
    this.baseUrl = bookmark.baseUrl
    const newParameters = JSON.stringify(bookmark.parameters)
    this.parameters = JSON.parse(newParameters)
    this.anchor = bookmark.anchor
    localStorage.setItem('baseUrl', bookmark.baseUrl)
    localStorage.setItem('parameters', newParameters)
    localStorage.setItem('anchor', bookmark.anchor)
    this.subprotocol = bookmark.subprotocol
    this.protobufContent = bookmark.protobufContent
    this.protobufTypePath = bookmark.protobufTypePath
    this.messageType = bookmark.messageType
    this.protocol = bookmark.protocol
    this.host = bookmark.host
    this.port = bookmark.port
    this.httpMethod = bookmark.httpMethod
    this.headers = bookmark.headers
    localStorage.setItem('headers', JSON.stringify(bookmark.headers))
  }
  setKeyOfParameter(index: number, e: KeyboardEvent) {
    this.parameters[index].key = (e.target as HTMLInputElement).value
    localStorage.setItem('parameters', JSON.stringify(this.parameters))
  }
  setKeyOfHeader(index: number, e: KeyboardEvent) {
    this.headers[index].key = (e.target as HTMLInputElement).value
    localStorage.setItem('headers', JSON.stringify(this.headers))
  }
  setKeyOfFormData(index: number, e: KeyboardEvent) {
    this.formDatas[index].key = (e.target as HTMLInputElement).value
  }
  setValueOfParameter(index: number, e: KeyboardEvent) {
    this.parameters[index].value = (e.target as HTMLInputElement).value
    localStorage.setItem('parameters', JSON.stringify(this.parameters))
  }
  setValueOfHeader(index: number, e: KeyboardEvent) {
    this.headers[index].value = (e.target as HTMLInputElement).value
    localStorage.setItem('headers', JSON.stringify(this.headers))
  }
  setValueOfFormData(index: number, e: KeyboardEvent) {
    const element = e.target as HTMLInputElement
    this.formDatas[index].value = element.files && element.files.length > 0 ? element.files[0] : element.value
  }
  setTypeOfFormData(index: number, e: KeyboardEvent) {
    this.formDatas[index].type = (e.target as HTMLSelectElement).value as 'text' | 'file'
  }
  deleteParameter(index: number) {
    this.parameters.splice(index, 1)
    localStorage.setItem('parameters', JSON.stringify(this.parameters))
  }
  deleteHeader(index: number) {
    this.headers.splice(index, 1)
    localStorage.setItem('headers', JSON.stringify(this.headers))
  }
  deleteFormData(index: number) {
    this.formDatas.splice(index, 1)
  }
  addParameter() {
    this.parameters.push({
      key: '',
      value: ''
    })
  }
  addHeader() {
    this.headers.push({
      key: '',
      value: ''
    })
  }
  addFormData() {
    this.formDatas.push({
      key: '',
      value: '',
      type: 'text'
    })
  }
  connect() {
    if (this.protocol === 'WebSocket') {
      try {
        this.websocket = this.subprotocol ? new WebSocket(this.url, this.subprotocol) : new WebSocket(this.url)
      } catch (error) {
        this.messages.unshift({
          moment: getNow(),
          type: 'error',
          reason: error.message,
          id: this.id++
        })
        return
      }

      this.websocket.binaryType = 'arraybuffer'
      this.websocket.onopen = this.onopen
      this.websocket.onclose = this.onclose
      this.websocket.onmessage = this.onmessage
      this.websocket.onerror = this.onerror
      if (this.isSocketIO) {
        pingId = setInterval(this.ping, 25000)
      }
    } else if (this.protocol === 'TCP' && proxyWebSocket && !isNaN(+this.port)) {
      const protocol: types.Protocol = {
        kind: types.ProtocolKind.tcpConnect,
        host: this.host,
        port: +this.port
      }
      proxyWebSocket.send(JSON.stringify(protocol))
    }
  }
  sendMessage() {
    this.send(this.message)
  }
  useStompConnectionMessage() {
    this.message = stompConnectionMessage
  }
  useStompSubscriptionMessage() {
    this.message = stompSubscriptionMessage
  }
  useStompSendMessage() {
    this.message = stompSendMessage
  }
  useSocketIOSendMessage() {
    this.message = socketIOSendMessage
  }
  useBayeuxHandshakeMessage() {
    this.message = bayeuxHandshakeMessage
  }
  useBayeuxSubscribeMessage() {
    this.message = bayeuxSubscribeMessage
  }
  useBayeuxPublishMessage() {
    this.message = bayeuxPublishMessage
  }
  useBayeuxPingMessage() {
    this.message = bayeuxPingMessage
  }
  clear() {
    this.messages = []
  }
  previewMessage() {
    this.isPreview = true
    if (this.protocol === 'WebSocket' && this.isSocketIO) {
      this.previewResult = ''
      previewDecoder.add(this.message)
    } else if (this.messageType === 'Uint8Array') {
      try {
        this.previewResult = new TextDecoder('utf-8').decode(new Uint8Array(this.message.split(',').map(m => +m)))
      } catch (error) {
        this.previewResult = error
      }
    } else {
      try {
        this.previewResult = JSON.stringify(JSON.parse(this.message), null, '    ')
      } catch (error) {
        this.previewResult = error
      }
    }
  }
  cancelPreview() {
    this.isPreview = false
  }
  showTips() {
    this.messages.unshift({
      moment: getNow(),
      type: 'tips',
      tips: 'Tips: \n' +
        "1. for socket.io, if you connect 'http://localhost', in ws's perspective, you connected 'ws://localhost/socket.io/?transport=websocket'\n" +
        "2. for socket.io, if you connect 'https://localhost', in ws's perspective, you connected 'wss://localhost/socket.io/?transport=websocket'\n" +
        "3. chrome's developer tool is a good tool to view ws connection and messages\n" +
        "4. for ActiveMQ, the default url is 'ws://localhost:61614' ,the subprotocol should be 'stomp'\n" +
        '5. for HTTP, set `Content-Type` be `application/x-www-form-urlencoded`, `multipart/form-data` or `text/plain` to avoid CORS preflight',
      id: this.id++
    })
  }
  close() {
    this.messages.unshift({
      moment: getNow(),
      type: 'tips',
      tips: 'Is going to disconnect manually.',
      id: this.id++
    })
    if (this.protocol === 'WebSocket') {
      this.websocket!.close()
    } else if (this.protocol === 'TCP') {
      const protocol: types.Protocol = {
        kind: types.ProtocolKind.tcpDisconnect
      }
      proxyWebSocket.send(JSON.stringify(protocol))
    }
  }
  onmessage(e: MessageEvent) {
    this.onmessageAccepted(e.data, e.type)
  }
  toggleMessageVisibility(message: Message) {
    message.visible = !this.messageVisibility(message)
  }
  resultId(index: number) {
    return `result-${index}`
  }
  messageVisibility(message: Message) {
    return message.visible !== undefined
      ? message.visible
      : (message.formattedData ? this.showFormatted : this.showRaw)
  }
  visibilityButtonStyle(message: Message) {
    return {
      position: 'absolute',
      bottom: (this.messageVisibility(message) ? (10 + message.visibilityButtonExtraBottom!) : 0) + 'px',
      right: 10 + 'px'
    }
  }
  private showError(error: Error) {
    this.messages.unshift({
      moment: getNow(),
      type: 'error',
      reason: error.message,
      id: this.id++
    })
  }
  private send(message: string) {
    let data: Uint8Array | string | undefined
    let isBinary = true

    if (this.messageType === 'Uint8Array') {
      data = new Uint8Array(this.message.split(',').map(m => +m))
    } else if (this.messageType === 'protobuf') {
      if (this.protobufType) {
        try {
          data = this.protobufType.encode(JSON.parse(this.message)).finish()
        } catch (error) {
          this.messages.unshift({
            moment: getNow(),
            type: 'error',
            reason: error.message,
            id: this.id++
          })
          return
        }
      } else {
        this.messages.unshift({
          moment: getNow(),
          type: 'error',
          reason: 'Protobuf file content is not loaded.',
          id: this.id++
        })
        return
      }
    } else {
      data = this.message
      isBinary = false
    }

    let rawData: string | undefined
    let formattedData: string | undefined
    if (this.protocol === 'WebSocket') {
      if (this.websocket && data) {
        if (!(this.ignorePing && message === '2')) {
          rawData = message
          formattedData = data.toString()
        }
        this.websocket.send(data)
      }
    } else if (this.protocol === 'TCP') {
      if (proxyWebSocket && data) {
        const protocol: types.Protocol = {
          kind: types.ProtocolKind.tcpSend,
          isBinary,
          message: typeof data === 'string' ? data : data.toString()
        }
        formattedData = JSON.stringify(protocol, null, '  ')
        proxyWebSocket.send(JSON.stringify(protocol))
      }
    } else if (this.protocol === 'UDP') {
      if (proxyWebSocket) {
        if (!this.dnsIsHidden) {
          const request = new DNSMessage(this.dnsTransactionId)
          request.addQuestion(this.dnsQuestionName)
          formattedData = JSON.stringify(request, null, '  ')
          data = request.encode()
          isBinary = true
        }

        if (data) {
          const protocol: types.Protocol = {
            kind: types.ProtocolKind.udpSend,
            address: this.host,
            port: +this.port,
            isBinary,
            message: typeof data === 'string' ? data : data.toString()
          }
          if (!formattedData) {
            formattedData = JSON.stringify(protocol, null, '  ')
          }
          proxyWebSocket.send(JSON.stringify(protocol))
        }
      }
    } else if (this.protocol === 'HTTP') {
      const request = new XMLHttpRequest()
      request.onloadend = e => {
        this.onmessageAccepted(`${request.status} ${request.statusText}\n${request.getAllResponseHeaders()}`, '')
        this.onmessageAccepted(request.response, '')
      }
      request.upload.onprogress = e => {
        const percent = Math.round(e.loaded * 100 / e.total)
        this.onmessageAccepted(`${e.loaded} / ${e.total} (${percent}%)`, '')
      }
      if (this.useProxy) {
        request.open(this.httpMethod, '/proxy')
        request.setRequestHeader(toUrlHeaderName, this.url)
        request.setRequestHeader(headersName, JSON.stringify(this.headers.filter(h => h.key)))
      } else {
        request.open(this.httpMethod, this.url)
        for (const header of this.headers) {
          request.setRequestHeader(header.key, header.value)
        }
      }

      if (this.shouldContainBody) {
        if (this.messageType === 'FormData') {
          const formData = new FormData()
          for (const { key, value } of this.formDatas) {
            if (key) {
              formData.append(key, value)
            }
          }
          request.send(formData)
        } else {
          request.send(this.message)
        }
      } else {
        request.send()
      }
    } else if (this.protocol === 'WebRTC' && this.dataChannel) {
      rawData = message
      this.dataChannel.send(message)
    }

    if (rawData) {
      this.messages.unshift({
        moment: getNow(),
        type: 'out',
        rawData,
        visible: undefined,
        visibilityButtonExtraBottom: 0,
        isBinary,
        id: this.id++
      })
    }

    if (formattedData) {
      this.messages.unshift({
        moment: getNow(),
        type: 'out',
        formattedData,
        visible: undefined,
        visibilityButtonExtraBottom: 0,
        isBinary,
        id: this.id++
      })
    }
  }
  private ping() {
    this.send('2')
  }
  private onopen(e: Event) {
    this.messages.unshift({
      moment: getNow(),
      type: e.type,
      id: this.id++
    })
  }
  private onclose(e: CloseEvent) {
    this.messages.unshift({
      moment: getNow(),
      type: e.type,
      reason: e.reason,
      id: this.id++
    })
    this.websocket = null
    clearInterval(pingId)
  }
  private onmessageAccepted(eventData: any, eventType: string) {
    if (this.ignorePing && eventData === '3') {
      return
    }

    const isBinary = typeof eventData !== 'string'

    if (eventData === '3') {
      this.messages.unshift({
        moment: getNow(),
        type: eventType,
        data: eventData,
        isBinary,
        id: this.id++
      })
      return
    }

    const type = 'in'
    let typedArray: Uint8Array | undefined
    let rawData: string
    if (isBinary) {
      typedArray = new Uint8Array(eventData)
      rawData = typedArray.toString()
    } else {
      typedArray = undefined
      rawData = eventData
    }
    this.messages.unshift({
      moment: getNow(),
      type,
      rawData,
      visible: undefined,
      visibilityButtonExtraBottom: 0,
      isBinary,
      id: this.id++
    })

    if (this.protocol === 'WebSocket' && this.isSocketIOInternally) {
      decoder.add(eventData)
    } else if (!isBinary) {
      try {
        const protocol: types.Protocol = JSON.parse(eventData)
        if (this.protocol !== 'WebSocket') {
          if (protocol.kind === types.ProtocolKind.tcpConnected) {
            this.tcpConnected = true
          } else if (protocol.kind === types.ProtocolKind.tcpDisconnected) {
            this.tcpConnected = false
          }
        }

        this.messages.unshift({
          moment: getNow(),
          type,
          formattedData: JSON.stringify(protocol, null, '    '),
          isBinary,
          visible: undefined,
          visibilityButtonExtraBottom: 0,
          id: this.id++
        })
      } catch (error) {
        printInConsole(error)
      }
    } else {
      try {
        const formattedData = new TextDecoder('utf-8').decode(typedArray!)
        this.messages.unshift({
          moment: getNow(),
          type,
          formattedData,
          isBinary,
          visible: undefined,
          visibilityButtonExtraBottom: 0,
          id: this.id++
        })
      } catch (error) {
        printInConsole(error)
      }

      if (this.protobufType) {
        try {
          const object = this.protobufType.toObject(this.protobufType.decode(typedArray!))
          this.messages.unshift({
            moment: getNow(),
            type,
            formattedData: JSON.stringify(object, null, '    '),
            isBinary,
            visible: undefined,
            visibilityButtonExtraBottom: 0,
            id: this.id++
          })
        } catch (error) {
          printInConsole(error)
        }
      } else if (!this.dnsIsHidden && typedArray) {
        try {
          const object = DNSMessage.parse(typedArray.buffer as ArrayBuffer)
          this.messages.unshift({
            moment: getNow(),
            type,
            formattedData: JSON.stringify(object, null, '    '),
            isBinary,
            visible: undefined,
            visibilityButtonExtraBottom: 0,
            id: this.id++
          })
        } catch (error) {
          printInConsole(error)
        }
      }
    }
  }
  private onerror(e: Event) {
    this.messages.unshift({
      moment: getNow(),
      type: e.type,
      id: this.id++
    })
    this.websocket = null
    clearInterval(pingId)
  }
  private showLocalDescription() {
    this.messages.unshift({
      moment: getNow(),
      type: 'tips',
      tips: JSON.stringify(this.peerConnection!.localDescription!.toJSON()),
      id: this.id++
    })
  }
}

const app = new App({
  el: '#body'
})

if (!WebSocket) {
  app.messages.unshift({
    moment: getNow(),
    type: 'tips',
    tips: "current browser doesn't support WebSocket",
    id: app.id++
  })
}

decoder.on('decoded', decodedPacket => {
  app.messages.unshift({
    moment: getNow(),
    type: 'in',
    formattedData: JSON.stringify(decodedPacket, null, '    '),
    visible: undefined,
    visibilityButtonExtraBottom: 0,
    id: app.id++
  })
})

previewDecoder.on('decoded', decodedPacket => {
  app.previewResult = JSON.stringify(decodedPacket, null, '    ')
})

window.onscroll = () => {
  const innerHeight = (window.innerHeight || document.documentElement!.clientHeight)
  for (let i = 0; i < app.messages.length; i++) {
    const message = app.messages[i]
    const element = document.getElementById(app.resultId(i))
    if (element) {
      const rect = element.getBoundingClientRect()
      message.visibilityButtonExtraBottom = (rect.top < innerHeight - 40 && rect.top + rect.height > innerHeight)
        ? (rect.top + rect.height - innerHeight) : 0
    }
  }
}

const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
proxyWebSocket = new WebSocket(`${wsProtocol}//${location.host}`)
proxyWebSocket.binaryType = 'arraybuffer'
proxyWebSocket.onmessage = event => {
  app.onmessage(event)
}
proxyWebSocket.onerror = event => {
  printInConsole(event)
  app.useProxy = false
}

if (navigator.serviceWorker && !location.host.startsWith('localhost')) {
  navigator.serviceWorker.register('service-worker.bundle.js').catch(error => {
    printInConsole('registration failed with error: ' + error)
  })
}

function printInConsole(message: any) {
  console.log(message)
}
