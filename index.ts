/// <reference types="clipboard" />
/// <reference types="tether-shepherd" />
/// <reference types="vue" />

import { VueComponent } from "vue-typescript";
import { Decoder } from "socket.io-parser";

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
}

type Message = {
    moment: string;
    type: string;
    reason?: string;
    data?: string;
    tips?: string;
    rawData?: any;
    formattedData?: any;
    visible?: boolean;
}

@VueComponent({
    template: require("raw!./template.html"),
})
class App extends Vue {
    public websocket: WebSocket | undefined = undefined;
    public messages: Message[] = [];
    public isSocketIOInternally: boolean = !!localStorage.getItem("isSocketIO");
    public ignorePingInternally: boolean = !!localStorage.getItem("ignorePing");
    public baseUrl: string = localStorage.getItem("baseUrl") || "ws://slack.socket.io/socket.io/";
    public parameters: Parameter[] = parameters ? JSON.parse(parameters) : [{ key: "transport", value: "websocket" }];
    public anchor: string = localStorage.getItem("anchor") || "";
    public messageInternally: string = localStorage.getItem("message") || "42[\"new message\",{\"username\":\"hello\",\"message\":\"world\"}]";
    public showRawInternally: boolean = !!localStorage.getItem("showRaw");
    public showFormattedInternally: boolean = !!localStorage.getItem("showFormatted");
    public previewResult: string = "";
    public isPreview: boolean = false;
    public bookmarks: Bookmark[] = bookmarks ? JSON.parse(bookmarks) : [];
    public isEditing: boolean = false;
    public bookmarkName: string = "";

    get canSaveAsBookmark() {
        if (this.bookmarkName.trim() === "") {
            return false;
        }
        for (let i = 0; i > this.bookmarks.length; i++) {
            if (this.bookmarks[i].name === this.bookmarkName) {
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
            for (let i = 0; i < this.parameters.length; i++) {
                const parameter = this.parameters[i];
                url += parameter.key + "=" + parameter.value + "&";
            }
            url = url.substring(0, url.length - 1);
        }
        if (this.anchor) {
            url += "#" + this.anchor;
        }
        return url;
    }
    set url(url) {
        let index = url.indexOf("#");
        if (index > -1) {
            url = url.substring(0, index);
            this.anchor = url.substring(index + 1);
        } else {
            this.anchor = "";
        }

        index = url.indexOf("?");
        if (index > -1) {
            this.baseUrl = url.substring(0, index);
            const array = url.substring(index + 1).split("&");
            const newParameters: Parameter[] = [];
            for (let i = 0; i < array.length; i++) {
                const tmp = array[i];
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
            this.baseUrl = url;
            this.parameters = [];
        }

        localStorage.setItem("baseUrl", this.baseUrl);
        localStorage.setItem("parameters", JSON.stringify(this.parameters));
        localStorage.setItem("anchor", this.anchor);
    }
    public savingAsBookmark() {
        this.isEditing = !this.isEditing;
        Vue.nextTick(() => {
            document.getElementById("bookmarkName") !.focus();
        });
    }
    public saveAsBookmark() {
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
    public deleteBookmark(index: number) {
        this.bookmarks.splice(index, 1);
        localStorage.setItem("bookmarks", JSON.stringify(this.bookmarks));
    }
    public useBookmark(index: number) {
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
    public setKeyOfParameter(index: number, e: KeyboardEvent) {
        this.parameters[index].key = (e.target as any).value;
        localStorage.setItem("parameters", JSON.stringify(this.parameters));
    }
    public setValueOfParameter(index: number, e: KeyboardEvent) {
        this.parameters[index].value = (e.target as any).value;
        localStorage.setItem("parameters", JSON.stringify(this.parameters));
    }
    public deleteParameter(index: number) {
        this.parameters.splice(index, 1);
        localStorage.setItem("parameters", JSON.stringify(this.parameters));
    }
    public addParameter() {
        this.parameters.push({
            key: "",
            value: "",
        });
    }
    public connect() {
        try {
            this.websocket = new WebSocket(this.url);
        } catch (error) {
            this.messages.unshift({
                moment: getNow(),
                type: "error",
                reason: error.message,
            });
            return;
        }

        this.websocket.onopen = this.onopen;
        this.websocket.onclose = this.onclose;
        this.websocket.onmessage = this.onmessage;
        this.websocket.onerror = this.onerror;
        if (this.isSocketIO) {
            pingId = setInterval(this.ping, 25000);
        }
    }
    public sendMessage() {
        this.send(this.message);
    }
    public send(message: string) {
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
    public ping() {
        this.send("2");
    }
    public clear() {
        this.messages = [];
    }
    public previewMessage() {
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
    public cancelPreview() {
        this.isPreview = false;
    }
    public showTips() {
        this.messages.unshift({
            moment: getNow(),
            type: "tips",
            tips: "Tips: \n" +
            "1. for socket.io, if you connect http://localhost, in ws's perspective, you connected ws://localhost/socket.io/?transport=websocket\n" +
            "2. for socket.io, if you connect https://localhost, in ws's perspective, you connected wss://localhost/socket.io/?transport=websocket\n" +
            "3. for socket.io, if you send a message(eg: {a_key:\"a_value\"}) in an event(eg: \"a_event\"), in ws's perspective, the actual message you send is: 42[\"a_event\",{\"a_key\":\"a_value\"}]\n" +
            "4. chrome's developer tool is a good tool to view ws connection and messages",
        });
    }
    public close() {
        this.messages.unshift({
            moment: getNow(),
            type: "tips",
            tips: "Is going to disconnect manually.",
        });
        this.websocket!.close();
    }
    public onopen(e: Event) {
        this.messages.unshift({
            moment: getNow(),
            type: e.type,
        });
    }
    public onclose(e: CloseEvent) {
        this.messages.unshift({
            moment: getNow(),
            type: e.type,
            reason: e.reason,
        });
        this.websocket = undefined;
        clearInterval(pingId);
    }
    public onmessage(e: MessageEvent) {
        if (this.ignorePing && e.data === "3") {
            return;
        }

        if (e.data === "3") {
            this.messages.unshift({
                moment: getNow(),
                type: e.type,
                data: e.data,
            });
            return;
        }

        this.messages.unshift({
            moment: getNow(),
            type: e.type,
            rawData: e.data,
            visible: undefined,
        });

        if (this.isSocketIOInternally) {
            decoder.add(e.data);
        } else {
            try {
                const json = JSON.parse(e.data);
                this.messages.unshift({
                    moment: getNow(),
                    type: e.type,
                    formattedData: json,
                });
            } catch (error) {
                console.log(error);
            }
        }
    }
    public onerror(e: ErrorEvent) {
        this.messages.unshift({
            moment: getNow(),
            type: e.type,
        });
        this.websocket = undefined;
        clearInterval(pingId);
    }
    public showMessage(index: number) {
        this.messages[index].visible = true;
    }
    public hideMessage(index: number) {
        this.messages[index].visible = false;
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
        type: "message",
        formattedData: JSON.stringify(decodedPacket, null, "    "),
        visible: undefined,
    });
});

previewDecoder.on("decoded", (decodedPacket: any) => {
    app.previewResult = JSON.stringify(decodedPacket, null, "    ");
});

if (!localStorage.getItem("tour")) {
    const tour = new Shepherd.Tour({
        defaults: {
            classes: "shepherd-theme-arrows",
            showCancelLink: true,
        },
    });

    tour.addStep("input url", {
        title: "input url",
        text: "input url of your websocket services here",
        attachTo: ".tour-input-url bottom",
        buttons: [
            {
                text: "Next",
                action: tour.next,
            },
        ],
    });
    tour.addStep("check", {
        title: "check",
        text: "check this if you are connecting a socket.io service",
        attachTo: ".tour-check right",
        buttons: [
            {
                text: "Next",
                action: tour.next,
            },
        ],
    });
    tour.addStep("connect", {
        title: "connect",
        text: "press this button to connect your websocket service",
        attachTo: ".tour-connect right",
        buttons: [
            {
                text: "Next",
                action: tour.next,
            },
        ],
    });
    tour.addStep("input message", {
        title: "input message",
        text: "input message that is about to send",
        attachTo: ".tour-input-message right",
        buttons: [
            {
                text: "Next",
                action: tour.next,
            },
        ],
    });
    tour.addStep("send message", {
        title: "send message",
        text: "press this button to send the message",
        attachTo: ".tour-send-message right",
        buttons: [
            {
                text: "Next",
                action: tour.next,
            },
        ],
    });
    tour.addStep("view messages", {
        title: "view messages",
        text: "all the messages in and out will be here",
        attachTo: ".tour-view-messages top",
        buttons: [
            {
                text: "Done",
                action: tour.next,
            },
        ],
    });

    tour.start();
    localStorage.setItem("tour", "1");
}
