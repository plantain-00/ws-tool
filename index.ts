import * as Vue from "vue";
import Component from "vue-class-component";
import { Decoder } from "socket.io-parser";
import * as Clipboard from "clipboard";
import * as protobuf from "protobufjs";
import { stompConnectionMessage, stompSubscriptionMessage, stompSendMessage } from "./messages";
import * as types from "./types";

declare class TextDecoder {
    constructor(encoding: string);
    decode(typedArray: Uint8Array): string;
}

new Clipboard(".clipboard");
let pingId: NodeJS.Timer;
const decoder = new Decoder();
const previewDecoder = new Decoder();
const parameters = localStorage.getItem("parameters");
const headers = localStorage.getItem("headers");
const bookmarks = localStorage.getItem("bookmarks");
let proxyWebSocket: WebSocket;
const toUrlHeaderName = "x-to-url";
const headersName = "x-headers";

function getNow() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    return (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
}

type Parameter = {
    key: string;
    value: string;
};

type FormData = {
    key: string;
    value: string | File;
    type: "text" | "file";
};

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
};

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
};

declare class RTCDataChannel {
    readyState: "open" | "close";
    onopen: (event: any) => void;
    onclose: (event: any) => void;
    onmessage: (event: MessageEvent) => void;
    send(message: string): void;
    close(): void;
}
declare class RTCPeerConnection {
    localDescription: RTCSessionDescription;
    ondatachannel: (event: { channel: RTCDataChannel }) => void;
    onicecandidate: (event: { candidate: RTCIceCandidate }) => void;
    createDataChannel(channel: string): RTCDataChannel;
    addIceCandidate(candidate: RTCIceCandidate): Promise<void>;
    createOffer(): Promise<RTCSessionDescription>;
    setLocalDescription(offer: RTCSessionDescription): Promise<void>;
    setRemoteDescription(offer: RTCSessionDescription): Promise<void>;
    createAnswer(): Promise<RTCSessionDescription>;
    close(): void;
}
declare class RTCSessionDescription {
    type: "offer" | "answer";
    sdp: string;
    constructor(description: { type: "offer", sdp: string; });
    toJSON(): { type: "offer" | "answer"; sdp: string };
}

@Component({
    template: require("raw!./app.html"),
})
class App extends Vue {
    websocket: WebSocket | null = null;
    messages: Message[] = [];
    isSocketIOInternally: boolean = !!localStorage.getItem("isSocketIO");
    ignorePingInternally: boolean = !!localStorage.getItem("ignorePing");
    baseUrl: string = localStorage.getItem("baseUrl") || "wss://copy.yorkyao.xyz/socket.io/";
    parameters: Parameter[] = parameters ? JSON.parse(parameters) : [{ key: "transport", value: "websocket" }, { key: "room", value: "test" }];
    anchor: string = localStorage.getItem("anchor") || "";
    messageInternally: string = localStorage.getItem("message") || "42[\"copy\",{\"username\":\"hello\",\"message\":\"world\"}]";
    showRawInternally: boolean = !!localStorage.getItem("showRaw");
    showFormattedInternally: boolean = !!localStorage.getItem("showFormatted");
    previewResult: string = "";
    isPreview: boolean = false;
    bookmarks: Bookmark[] = bookmarks ? JSON.parse(bookmarks) : [];
    isEditing: boolean = false;
    bookmarkName: string = "";
    subprotocolInternally = localStorage.getItem("subprotocol") || "";
    filter = "";
    filterIsHidden: boolean = true;
    stompIsHidden = true;
    protobufType: protobuf.Type | null = null;
    protobufContentInternally = localStorage.getItem("protobufContent") || `package testPackage;
syntax = "proto3";
message Test {
    required string data = 1;
}`;
    protobufTypePathInternally = localStorage.getItem("protobufTypePath") || "testPackage.Test";
    protobufIsHidden = true;
    messageTypeInternally = localStorage.getItem("messageType") || "string";
    protocolInternally = localStorage.getItem("protocol") || "WebSocket";
    hostInternally = localStorage.getItem("host") || "localhost";
    portInternally = +localStorage.getItem("port") || 9999;
    tcpConnected = false;
    httpMethodInternally = localStorage.getItem("httpMethod") || "GET";
    headers: types.Header[] = headers ? JSON.parse(headers) : [{ key: "Content-Type", value: "application/json" }];
    socketIOIsHidden: boolean = true;
    formDatas: FormData[] = [];
    peerConnection = new RTCPeerConnection();
    dataChannel: RTCDataChannel | null = null;
    dataChannelName = "my_test_channel";
    sessionDescription = "";
    isDataChannelConnected = false;
    dataChannelStatus: "none" | "init" | "created offer" | "answered offer" | "set answer" = "none";

    constructor(options?: Vue.ComponentOptions<Vue>) {
        super(options);
        this.peerConnection.ondatachannel = event => {
            event.channel.onopen = e => {
                app.isDataChannelConnected = true;
                this.messages.unshift({
                    moment: getNow(),
                    type: "tips",
                    tips: "peer connection opened.",
                });
            };
            event.channel.onclose = e => {
                app.isDataChannelConnected = false;
                this.messages.unshift({
                    moment: getNow(),
                    type: "tips",
                    tips: "peer connection closed.",
                });
            };
            event.channel.onmessage = e => {
                this.onmessage(e);
            };
        };
        this.peerConnection.onicecandidate = e => !e.candidate;
    }

    get httpMethod() {
        return this.httpMethodInternally;
    }
    set httpMethod(value: string) {
        localStorage.setItem("httpMethod", value);
        this.httpMethodInternally = value;
    }
    get host() {
        return this.hostInternally;
    }
    set host(value: string) {
        localStorage.setItem("host", value);
        this.hostInternally = value;
    }
    get port() {
        return this.portInternally;
    }
    set port(value: number) {
        localStorage.setItem("port", String(value));
        this.portInternally = value;
    }
    get protocol() {
        return this.protocolInternally;
    }
    set protocol(value: string) {
        if (value === "HTTP" || this.messageType === "FormData") {
            this.messageType = "string";
        }
        localStorage.setItem("protocol", value);
        this.protocolInternally = value;
    }
    get messageType() {
        return this.messageTypeInternally;
    }
    set messageType(value: string) {
        localStorage.setItem("messageType", value);
        this.messageTypeInternally = value;
    }
    get protobufContent() {
        return this.protobufContentInternally;
    }
    set protobufContent(value: string) {
        localStorage.setItem("protobufContent", value);
        this.protobufContentInternally = value;
    }
    get protobufTypePath() {
        return this.protobufTypePathInternally;
    }
    set protobufTypePath(value: string) {
        localStorage.setItem("protobufTypePath", value);
        this.protobufTypePathInternally = value;
    }
    get filteredMessages() {
        return this.messages.filter(m => {
            if (this.filter) {
                return (typeof m.rawData === "string" && m.rawData.indexOf(this.filter) !== -1)
                    || (typeof m.moment === "string" && m.moment.indexOf(this.filter) !== -1)
                    || (typeof m.formattedData === "string" && m.formattedData.indexOf(this.filter) !== -1)
                    || (typeof m.type === "string" && m.type.indexOf(this.filter) !== -1)
                    || (typeof m.reason === "string" && m.reason.indexOf(this.filter) !== -1)
                    || (typeof m.data === "string" && m.data.indexOf(this.filter) !== -1)
                    || (typeof m.tips === "string" && m.tips.indexOf(this.filter) !== -1);
            } else {
                return true;
            }
        });
    }
    get subprotocol() {
        return this.subprotocolInternally;
    }
    set subprotocol(value) {
        localStorage.setItem("subprotocol", value);
        this.subprotocolInternally = value;
    }
    get canSaveAsBookmark() {
        if (this.bookmarkName.trim() === "") {
            return false;
        }
        for (const bookmark of this.bookmarks) {
            if (bookmark.name === this.bookmarkName) {
                return false;
            }
        }
        return true;
    }
    get isSocketIO() {
        return this.isSocketIOInternally;
    }
    set isSocketIO(value) {
        localStorage.setItem("isSocketIO", value ? "1" : "");
        this.isSocketIOInternally = value;
    }
    get ignorePing() {
        return this.ignorePingInternally;
    }
    set ignorePing(value) {
        localStorage.setItem("ignorePing", value ? "1" : "");
        this.ignorePingInternally = value;
    }
    get showRaw() {
        return this.showRawInternally;
    }
    set showRaw(value) {
        localStorage.setItem("showRaw", value ? "1" : "");
        this.showRawInternally = value;
    }
    get showFormatted() {
        return this.showFormattedInternally;
    }
    set showFormatted(value) {
        localStorage.setItem("showFormatted", value ? "1" : "");
        this.showFormattedInternally = value;
    }
    get message() {
        return this.messageInternally;
    }
    set message(value) {
        localStorage.setItem("message", value);
        this.messageInternally = value;
    }
    get url() {
        let url = this.baseUrl;
        if (this.parameters.length > 0) {
            url += "?";
            for (const parameter of this.parameters) {
                url += parameter.key + "=" + parameter.value + "&";
            }
            url = url.substring(0, url.length - 1);
        }
        if (this.anchor) {
            url += "#" + this.anchor;
        }
        return url;
    }
    set url(value) {
        let index = value.indexOf("#");
        if (index > -1) {
            value = value.substring(0, index);
            this.anchor = value.substring(index + 1);
        } else {
            this.anchor = "";
        }

        index = value.indexOf("?");
        if (index > -1) {
            this.baseUrl = value.substring(0, index);
            const array = value.substring(index + 1).split("&");
            const newParameters: Parameter[] = [];
            for (const tmp of array) {
                index = tmp.indexOf("=");
                if (index === -1) {
                    newParameters.push({
                        key: tmp,
                        value: "",
                    });
                } else {
                    newParameters.push({
                        key: tmp.substring(0, index),
                        value: tmp.substring(index + 1),
                    });
                }
            }
            this.parameters = newParameters;
        } else {
            this.baseUrl = value;
            this.parameters = [];
        }

        localStorage.setItem("baseUrl", this.baseUrl);
        localStorage.setItem("parameters", JSON.stringify(this.parameters));
        localStorage.setItem("anchor", this.anchor);
    }
    get isConnected() {
        return (this.protocol === "WebSocket" && this.websocket)
            || (this.protocol === "TCP" && this.tcpConnected);
    }
    get isDisconnected() {
        return (this.protocol === "WebSocket" && !this.websocket)
            || (this.protocol === "TCP" && !this.tcpConnected)
            || (this.protocol === "WebRTC" && !(this.dataChannel && this.isDataChannelConnected));
    }
    get shouldContainBody() {
        return this.httpMethod === "POST"
            || this.httpMethod === "PUT"
            || this.httpMethod === "PATCH"
            || this.httpMethod === "DELETE"
            || this.httpMethod === "LINK"
            || this.httpMethod === "UNLINK";
    }
    createDataChannel() {
        this.dataChannel = this.peerConnection.createDataChannel(this.dataChannelName);
        this.dataChannelStatus = "init";
        this.messages.unshift({
            moment: getNow(),
            type: "tips",
            tips: `create data channel successfully: ${this.dataChannelName}`,
        });
    }
    createOffer() {
        this.peerConnection.createOffer()
            .then(offer => this.peerConnection.setLocalDescription(offer))
            .then(() => {
                this.messages.unshift({
                    moment: getNow(),
                    type: "tips",
                    tips: JSON.stringify(this.peerConnection.localDescription.toJSON()),
                });
                this.dataChannelStatus = "created offer";
            }, (error: Error) => {
                this.messages.unshift({
                    moment: getNow(),
                    type: "error",
                    reason: error.message,
                });
            });
    }
    answerOffer() {
        try {
            const offer = new RTCSessionDescription(JSON.parse(this.sessionDescription));
            this.peerConnection.setRemoteDescription(offer)
                .then(() => this.peerConnection.createAnswer())
                .then(answer => this.peerConnection.setLocalDescription(answer))
                .then(() => {
                    this.messages.unshift({
                        moment: getNow(),
                        type: "tips",
                        tips: JSON.stringify(this.peerConnection.localDescription.toJSON()),
                    });
                    this.dataChannelStatus = "answered offer";
                }, (error: Error) => {
                    this.messages.unshift({
                        moment: getNow(),
                        type: "error",
                        reason: error.message,
                    });
                });
        } catch (error) {
            this.messages.unshift({
                moment: getNow(),
                type: "error",
                reason: error.message,
            });
        }
    }
    setAnswer() {
        try {
            const answer = new RTCSessionDescription(JSON.parse(this.sessionDescription));
            this.peerConnection.setRemoteDescription(answer)
                .then(() => {
                    this.messages.unshift({
                        moment: getNow(),
                        type: "tips",
                        tips: "set answer successfully.",
                    });
                    this.dataChannelStatus = "set answer";
                }, (error: Error) => {
                    this.messages.unshift({
                        moment: getNow(),
                        type: "error",
                        reason: error.message,
                    });
                });
        } catch (error) {
            this.messages.unshift({
                moment: getNow(),
                type: "error",
                reason: error.message,
            });
        }
    }
    loadProtobuf() {
        if (this.protobufContent && this.protobufTypePath) {
            try {
                this.protobufType = protobuf.parse(this.protobufContent).root.lookup(this.protobufTypePath) as protobuf.Type;
                this.messages.unshift({
                    moment: getNow(),
                    type: "tips",
                    tips: "The protobuf definitions is loaded successfully.",
                });
            } catch (error) {
                this.messages.unshift({
                    moment: getNow(),
                    type: "error",
                    reason: error.message,
                });
            }
        }
    }
    savingAsBookmark() {
        this.isEditing = !this.isEditing;
        Vue.nextTick(() => {
            const bookmarkNameElement = document.getElementById("bookmarkName");
            if (bookmarkNameElement) {
                bookmarkNameElement.focus();
            }
        });
    }
    toggleFilter() {
        this.filterIsHidden = !this.filterIsHidden;
        Vue.nextTick(() => {
            const filterElement = document.getElementById("filter");
            if (filterElement) {
                filterElement.focus();
            }
        });
    }
    toggleSocketIO() {
        this.socketIOIsHidden = !this.socketIOIsHidden;
    }
    toggleStomp() {
        this.stompIsHidden = !this.stompIsHidden;
    }
    toggleProtobuf() {
        this.protobufIsHidden = !this.protobufIsHidden;
    }
    saveAsBookmark() {
        this.isEditing = false;
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
        });
        localStorage.setItem("bookmarks", JSON.stringify(this.bookmarks));
    }
    deleteBookmark(index: number) {
        this.bookmarks.splice(index, 1);
        localStorage.setItem("bookmarks", JSON.stringify(this.bookmarks));
    }
    useBookmark(index: number) {
        const bookmark = this.bookmarks[index];
        this.isSocketIO = bookmark.isSocketIO;
        this.ignorePing = bookmark.ignorePing;
        this.showRaw = bookmark.showRaw;
        this.showFormatted = bookmark.showFormatted;
        this.message = bookmark.message;
        this.baseUrl = bookmark.baseUrl;
        const newParameters = JSON.stringify(bookmark.parameters);
        this.parameters = JSON.parse(newParameters);
        this.anchor = bookmark.anchor;
        localStorage.setItem("baseUrl", bookmark.baseUrl);
        localStorage.setItem("parameters", newParameters);
        localStorage.setItem("anchor", bookmark.anchor);
        this.subprotocol = bookmark.subprotocol;
        this.protobufContent = bookmark.protobufContent;
        this.protobufTypePath = bookmark.protobufTypePath;
        this.messageType = bookmark.messageType;
        this.protocol = bookmark.protocol;
        this.host = bookmark.host;
        this.port = bookmark.port;
        this.httpMethod = bookmark.httpMethod;
        this.headers = bookmark.headers;
        localStorage.setItem("headers", JSON.stringify(bookmark.headers));
    }
    setKeyOfParameter(index: number, e: KeyboardEvent) {
        this.parameters[index].key = (e.target as HTMLInputElement).value;
        localStorage.setItem("parameters", JSON.stringify(this.parameters));
    }
    setKeyOfHeader(index: number, e: KeyboardEvent) {
        this.headers[index].key = (e.target as HTMLInputElement).value;
        localStorage.setItem("headers", JSON.stringify(this.headers));
    }
    setKeyOfFormData(index: number, e: KeyboardEvent) {
        this.formDatas[index].key = (e.target as HTMLInputElement).value;
    }
    setValueOfParameter(index: number, e: KeyboardEvent) {
        this.parameters[index].value = (e.target as HTMLInputElement).value;
        localStorage.setItem("parameters", JSON.stringify(this.parameters));
    }
    setValueOfHeader(index: number, e: KeyboardEvent) {
        this.headers[index].value = (e.target as HTMLInputElement).value;
        localStorage.setItem("headers", JSON.stringify(this.headers));
    }
    setValueOfFormData(index: number, e: KeyboardEvent) {
        const element = e.target as HTMLInputElement;
        if (element.files && element.files.length > 0) {
            this.formDatas[index].value = element.files[0];
        } else {
            this.formDatas[index].value = element.value;
        }
    }
    setTypeOfFormData(index: number, e: KeyboardEvent) {
        this.formDatas[index].type = (e.target as HTMLSelectElement).value as "text" | "file";
    }
    deleteParameter(index: number) {
        this.parameters.splice(index, 1);
        localStorage.setItem("parameters", JSON.stringify(this.parameters));
    }
    deleteHeader(index: number) {
        this.headers.splice(index, 1);
        localStorage.setItem("headers", JSON.stringify(this.headers));
    }
    deleteFormData(index: number) {
        this.formDatas.splice(index, 1);
    }
    addParameter() {
        this.parameters.push({
            key: "",
            value: "",
        });
    }
    addHeader() {
        this.headers.push({
            key: "",
            value: "",
        });
    }
    addFormData() {
        this.formDatas.push({
            key: "",
            value: "",
            type: "text",
        });
    }
    connect() {
        if (this.protocol === "WebSocket") {
            try {
                if (this.subprotocol) {
                    this.websocket = new WebSocket(this.url, this.subprotocol);
                } else {
                    this.websocket = new WebSocket(this.url);
                }
            } catch (error) {
                this.messages.unshift({
                    moment: getNow(),
                    type: "error",
                    reason: error.message,
                });
                return;
            }

            this.websocket.binaryType = "arraybuffer";
            this.websocket.onopen = this.onopen;
            this.websocket.onclose = this.onclose;
            this.websocket.onmessage = this.onmessage;
            this.websocket.onerror = this.onerror;
            if (this.isSocketIO) {
                pingId = setInterval(this.ping, 25000);
            }
        } else if (this.protocol === "TCP") {
            if (proxyWebSocket && !isNaN(+this.port)) {
                const protocol: types.Protocol = {
                    kind: "tcp:connect",
                    host: this.host,
                    port: +this.port,
                };
                proxyWebSocket.send(JSON.stringify(protocol));
            }
        }
    }
    sendMessage() {
        this.send(this.message);
    }
    useStompConnectionMessage() {
        this.message = stompConnectionMessage;
    }
    useStompSubscriptionMessage() {
        this.message = stompSubscriptionMessage;
    }
    useStompSendMessage() {
        this.message = stompSendMessage;
    }
    send(message: string) {
        let data: Uint8Array | string | undefined;
        let isBinary = true;
        try {
            if (this.messageType === "Uint8Array") {
                data = new Uint8Array(this.message.split(",").map(m => +m));
            } else if (this.messageType === "protobuf") {
                if (this.protobufType) {
                    const object = JSON.parse(this.message);
                    data = this.protobufType.encode(object).finish();
                } else {
                    this.messages.unshift({
                        moment: getNow(),
                        type: "error",
                        reason: "Protobuf file content is not loaded.",
                    });
                    return;
                }
            } else {
                data = this.message;
                isBinary = false;
            }
        } catch (error) {
            this.messages.unshift({
                moment: getNow(),
                type: "error",
                reason: error.message,
            });
            return;
        }

        let rawData: string | undefined = undefined;
        let formattedData: string | undefined = undefined;
        if (this.protocol === "WebSocket") {
            if (this.websocket && data) {
                if (!(this.ignorePing && message === "2")) {
                    rawData = message;
                    formattedData = data.toString();
                }
                this.websocket.send(data);
            }
        } else if (this.protocol === "TCP") {
            if (proxyWebSocket && data) {
                const protocol: types.Protocol = {
                    kind: "tcp:send",
                    isBinary,
                    message: typeof data === "string" ? data : data.toString(),
                };
                formattedData = JSON.stringify(protocol, null, "  ");
                proxyWebSocket.send(JSON.stringify(protocol));
            }
        } else if (this.protocol === "UDP") {
            if (proxyWebSocket && data) {
                const protocol: types.Protocol = {
                    kind: "udp:send",
                    address: this.host,
                    port: +this.port,
                    isBinary,
                    message: typeof data === "string" ? data : data.toString(),
                };
                formattedData = JSON.stringify(protocol, null, "  ");
                proxyWebSocket.send(JSON.stringify(protocol));
            }
        } else if (this.protocol === "HTTP") {
            const request = new XMLHttpRequest();
            request.onloadend = e => {
                this.onmessageAccepted(`${request.status} ${request.statusText}\n${request.getAllResponseHeaders()}`, "");
                this.onmessageAccepted(request.response, "");
            };
            request.open(this.httpMethod, "/proxy");
            request.setRequestHeader(toUrlHeaderName, this.url);
            request.setRequestHeader(headersName, JSON.stringify(this.headers.filter(h => h.key)));

            if (this.shouldContainBody) {
                if (this.messageType === "FormData") {
                    const formData = new FormData();
                    for (const {key, value} of this.formDatas) {
                        if (key) {
                            formData.append(key, value);
                        }
                    }
                    request.send(formData);
                } else {
                    request.send(this.message);
                }
            } else {
                request.send();
            }
        } else if (this.protocol === "WebRTC") {
            if (this.dataChannel) {
                rawData = message;
                this.dataChannel.send(message);
            }
        }

        if (rawData) {
            this.messages.unshift({
                moment: getNow(),
                type: "out",
                rawData,
                visible: undefined,
                visibilityButtonExtraBottom: 0,
                isBinary,
            });
        }

        if (formattedData) {
            this.messages.unshift({
                moment: getNow(),
                type: "out",
                formattedData,
                visible: undefined,
                visibilityButtonExtraBottom: 0,
                isBinary,
            });
        }
    }
    ping() {
        this.send("2");
    }
    clear() {
        this.messages = [];
    }
    previewMessage() {
        this.isPreview = true;
        if (this.protocol === "WebSocket" && this.isSocketIO) {
            this.previewResult = "";
            previewDecoder.add(this.message);
        } else if (this.messageType === "Uint8Array") {
            try {
                this.previewResult = new TextDecoder("utf-8").decode(new Uint8Array(this.message.split(",").map(m => +m)));
            } catch (error) {
                this.previewResult = error;
            }
        } else {
            try {
                this.previewResult = JSON.stringify(JSON.parse(this.message), null, "    ");
            } catch (error) {
                this.previewResult = error;
            }
        }
    }
    cancelPreview() {
        this.isPreview = false;
    }
    showTips() {
        this.messages.unshift({
            moment: getNow(),
            type: "tips",
            tips: "Tips: \n" +
            "1. for socket.io, if you connect 'http://localhost', in ws's perspective, you connected 'ws://localhost/socket.io/?transport=websocket'\n" +
            "2. for socket.io, if you connect 'https://localhost', in ws's perspective, you connected 'wss://localhost/socket.io/?transport=websocket'\n" +
            `3. for socket.io, if you send a message(eg: {a_key:"a_value"}) in an event(eg: "a_event"), in ws's perspective, the actual message you send is: 42["a_event",{"a_key":"a_value"}]\n` +
            "4. chrome's developer tool is a good tool to view ws connection and messages\n" +
            "5. for ActiveMQ, the default url is 'ws://localhost:61614' ,the subprotocol should be 'stomp'",
        });
    }
    close() {
        this.messages.unshift({
            moment: getNow(),
            type: "tips",
            tips: "Is going to disconnect manually.",
        });
        if (this.protocol === "WebSocket") {
            this.websocket!.close();
        } else if (this.protocol === "TCP") {
            const protocol: types.Protocol = {
                kind: "tcp:disconnect",
            };
            proxyWebSocket.send(JSON.stringify(protocol));
        }
    }
    onopen(e: Event) {
        this.messages.unshift({
            moment: getNow(),
            type: e.type,
        });
    }
    onclose(e: CloseEvent) {
        this.messages.unshift({
            moment: getNow(),
            type: e.type,
            reason: e.reason,
        });
        this.websocket = null;
        clearInterval(pingId);
    }
    onmessage(e: MessageEvent) {
        this.onmessageAccepted(e.data, e.type);
    }
    onmessageAccepted(eventData: any, eventType: string) {
        if (this.ignorePing && eventData === "3") {
            return;
        }

        const isBinary = typeof eventData !== "string";

        if (eventData === "3") {
            this.messages.unshift({
                moment: getNow(),
                type: eventType,
                data: eventData,
                isBinary,
            });
            return;
        }

        const type = "in";
        let typedArray: Uint8Array | undefined;
        let rawData: string;
        if (isBinary) {
            typedArray = new Uint8Array(eventData);
            rawData = typedArray.toString();
        } else {
            typedArray = undefined;
            rawData = eventData;
        }
        this.messages.unshift({
            moment: getNow(),
            type,
            rawData,
            visible: undefined,
            visibilityButtonExtraBottom: 0,
            isBinary,
        });

        if (this.protocol === "WebSocket" && this.isSocketIOInternally) {
            decoder.add(eventData);
        } else if (!isBinary) {
            try {
                const protocol: types.Protocol = JSON.parse(eventData);
                if (this.protocol !== "WebSocket") {
                    if (protocol.kind === "tcp:connected") {
                        this.tcpConnected = true;
                    } else if (protocol.kind === "tcp:disconnected") {
                        this.tcpConnected = false;
                    }
                }

                this.messages.unshift({
                    moment: getNow(),
                    type,
                    formattedData: JSON.stringify(protocol, null, "    "),
                    isBinary,
                    visible: undefined,
                    visibilityButtonExtraBottom: 0,
                });
            } catch (error) {
                console.log(error);
            }
        } else {
            try {
                const formattedData = new TextDecoder("utf-8").decode(typedArray!);
                this.messages.unshift({
                    moment: getNow(),
                    type,
                    formattedData,
                    isBinary,
                    visible: undefined,
                    visibilityButtonExtraBottom: 0,
                });
            } catch (error) {
                console.log(error);
            }

            if (this.protobufType) {
                try {
                    const json = this.protobufType.decode(typedArray!).asJSON();
                    this.messages.unshift({
                        moment: getNow(),
                        type,
                        formattedData: JSON.stringify(json, null, "    "),
                        isBinary,
                        visible: undefined,
                        visibilityButtonExtraBottom: 0,
                    });
                } catch (error) {
                    console.log(error);
                }
            }
        }
    }
    onerror(e: ErrorEvent) {
        this.messages.unshift({
            moment: getNow(),
            type: e.type,
        });
        this.websocket = null;
        clearInterval(pingId);
    }
    toggleMessageVisibility(message: Message) {
        message.visible = !this.messageVisibility(message);
    }
    resultId(index: number) {
        return `result-${index}`;
    }
    messageVisibility(message: Message) {
        return message.visible !== undefined
            ? message.visible
            : (message.formattedData ? this.showFormatted : this.showRaw);
    }
    visibilityButtonStyle(message: Message) {
        return {
            position: "absolute",
            bottom: (this.messageVisibility(message) ? (10 + message.visibilityButtonExtraBottom) : 0) + "px",
            right: 10 + "px",
        };
    }
}

const app = new App({
    el: "#body",
});

if (!WebSocket) {
    app.messages.unshift({
        moment: getNow(),
        type: "tips",
        tips: "current browser doesn't support WebSocket",
    });
}

decoder.on("decoded", (decodedPacket: any) => {
    app.messages.unshift({
        moment: getNow(),
        type: "in",
        formattedData: JSON.stringify(decodedPacket, null, "    "),
        visible: undefined,
        visibilityButtonExtraBottom: 0,
    });
});

previewDecoder.on("decoded", (decodedPacket: any) => {
    app.previewResult = JSON.stringify(decodedPacket, null, "    ");
});

window.onscroll = () => {
    const innerHeight = (window.innerHeight || document.documentElement.clientHeight);
    for (let i = 0; i < app.messages.length; i++) {
        const message = app.messages[i];
        const element = document.getElementById(app.resultId(i));
        if (element) {
            const rect = element.getBoundingClientRect();
            message.visibilityButtonExtraBottom = (rect.top < innerHeight - 40 && rect.top + rect.height > innerHeight)
                ? (rect.top + rect.height - innerHeight) : 0;
        }
    }
};

const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
proxyWebSocket = new WebSocket(`${wsProtocol}//${location.host}`);
proxyWebSocket.binaryType = "arraybuffer";
proxyWebSocket.onmessage = event => {
    app.onmessage(event);
};
