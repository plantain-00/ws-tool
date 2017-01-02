import * as Vue from "vue";
import Component from "vue-class-component";
import { Decoder } from "socket.io-parser";
import * as Clipboard from "clipboard";
import * as protobuf from "protobufjs";
import { stompConnectionMessage, stompSubscriptionMessage, stompSendMessage } from "./messages";

new Clipboard(".clipboard");
let pingId: NodeJS.Timer;
const decoder = new Decoder();
const previewDecoder = new Decoder();
const parameters = localStorage.getItem("parameters");
const bookmarks = localStorage.getItem("bookmarks");

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

@Component({
    template: require("raw!./app.html"),
})
class App extends Vue {
    websocket: WebSocket | null = null;
    messages: Message[] = [];
    isSocketIOInternally: boolean = !!localStorage.getItem("isSocketIO");
    ignorePingInternally: boolean = !!localStorage.getItem("ignorePing");
    baseUrl: string = localStorage.getItem("baseUrl") || "ws://slack.socket.io/socket.io/";
    parameters: Parameter[] = parameters ? JSON.parse(parameters) : [{ key: "transport", value: "websocket" }];
    anchor: string = localStorage.getItem("anchor") || "";
    messageInternally: string = localStorage.getItem("message") || "42[\"new message\",{\"username\":\"hello\",\"message\":\"world\"}]";
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
    loadProtobuf() {
        if (this.protobufContent && this.protobufTypePath) {
            try {
                this.protobufType = protobuf.parse(this.protobufContent).root.lookup(this.protobufTypePath) as protobuf.Type;
                this.messages.unshift({
                    moment: getNow(),
                    type: "tips",
                    tips: "The protobuf is applied successfully.",
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
    }
    setKeyOfParameter(index: number, e: KeyboardEvent) {
        this.parameters[index].key = (e.target as any).value;
        localStorage.setItem("parameters", JSON.stringify(this.parameters));
    }
    setValueOfParameter(index: number, e: KeyboardEvent) {
        this.parameters[index].value = (e.target as any).value;
        localStorage.setItem("parameters", JSON.stringify(this.parameters));
    }
    deleteParameter(index: number) {
        this.parameters.splice(index, 1);
        localStorage.setItem("parameters", JSON.stringify(this.parameters));
    }
    addParameter() {
        this.parameters.push({
            key: "",
            value: "",
        });
    }
    connect() {
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
        if (this.websocket) {
            if (!this.ignorePing || message !== "2") {
                this.messages.unshift({
                    moment: getNow(),
                    type: "out",
                    data: message,
                });
            }
            this.websocket.send(message);
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
        if (this.isSocketIO) {
            this.previewResult = "";
            previewDecoder.add(this.message);
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
        this.websocket!.close();
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
        if (this.ignorePing && e.data === "3") {
            return;
        }

        const isBinary = typeof e.data !== "string";

        if (e.data === "3") {
            this.messages.unshift({
                moment: getNow(),
                type: e.type,
                data: e.data,
                isBinary,
            });
            return;
        }

        const type = "in";
        let typedArray: Uint8Array | undefined;
        let rawData: string;
        if (isBinary) {
            typedArray = new Uint8Array(e.data);
            rawData = typedArray.toString();
        } else {
            typedArray = undefined;
            rawData = e.data;
        }
        this.messages.unshift({
            moment: getNow(),
            type,
            rawData,
            visible: undefined,
            visibilityButtonExtraBottom: 0,
            isBinary,
        });

        if (this.isSocketIOInternally) {
            decoder.add(e.data);
        } else if (!isBinary) {
            try {
                const json = JSON.parse(e.data);
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
        } else if (this.protobufType) {
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
