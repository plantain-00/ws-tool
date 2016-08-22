/// <reference types="clipboard" />
/// <reference types="tether-shepherd" />

import Component from "vue-class-component";

new Clipboard(".clipboard");
let pingId: NodeJS.Timer;
const parser = require("socket.io-parser");
const decoder = new parser.Decoder();
const previewDecoder = new parser.Decoder();
const parameters = localStorage.getItem("parameters");
const bookmarks = localStorage.getItem("bookmarks");

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
}

@Component({
    template: `
    <div>
        <ul class="bookmarks list-unstyled">
            <li v-for="bookmark in bookmarks">
                <button class="btn btn-link btn-xs hint--bottom hint--rounded" @click="useBookmark($index)" data-hint="set this configuration as current configuration">{{bookmark.name}}</button>
                <button class="btn btn-link btn-xs hint--bottom hint--rounded" @click="deleteBookmark($index)" data-hint="delete this configuration">delete</button>
            </li>
        </ul>
        <div class="main">
            <div class="container">
                <div class="row">
                    <div class="col-md-12">
                        <h4>WebSocket/Socket.IO Test Tool</h4>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12" class="hint--bottom hint--rounded" data-hint="input url of your websocket services here">
                        <input id="url" type="url" class="form-control tour-input-url" v-model="url">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <label class="hint--right hint--rounded" data-hint="check this if you are connecting a socket.io service">
                            <input type="checkbox" v-model="isSocketIO" disabled={{!!websocket}} class="tour-check"> socket.io
                        </label>
                        <label v-show="isSocketIO" class="hint--right hint--rounded" data-hint="ping/pong is like heartbeat">
                            <input type="checkbox" v-model="ignorePing" disabled={{!!websocket}}> will hide ping/pong of socket.io
                        </label>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <button class="btn btn-primary btn-sm tour-connect hint--right hint--rounded" @click="connect()" disabled={{!!websocket}} data-hint="press this button to connect your websocket service">connect</button>
                        <button class="btn btn-default btn-sm tour-connect hint--right hint--rounded" @click="close()" disabled={{!websocket}} data-hint="press this button to disconnect">disconnect</button>
                        <button class="btn btn-default btn-sm clipboard hint--right hint--rounded" data-clipboard-target="#url" data-hint="press this button to copy the url to your paste board">copy URL</button>
                        <button class="btn btn-default btn-sm" @click="addParameter()">add a parameter</button>
                        <button class="btn btn-default btn-sm" @click="showTips()">show tips</button>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="col-md-12 hint--right hint--rounded" data-hint="input message that is about to send">
                            <textarea style="width:100%;height:200px;" class="form-control tour-input-message" v-model="message" v-show="!isPreview"></textarea>
                            <pre v-else>{{previewResult}}</pre>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div v-for="parameter in parameters">
                            <div class="col-md-3">
                                <input type="text" class="form-control input-sm" value={{parameter.key}} @keyup="setKeyOfParameter($index, $event)">
                            </div>
                            <div class="col-md-7">
                                <input type="text" class="form-control input-sm" value={{parameter.value}} @keyup="setValueOfParameter($index, $event)">
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-link btn-sm hint--right hint--rounded" @click="deleteParameter($index)" data-hint="delete the parameter">delete</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <label class="hint--right hint--rounded" data-hint="show raw string of the messages">
                            <input type="checkbox" v-model="showRaw"> show raw data
                        </label>
                        <label class="hint--right hint--rounded" data-hint="show formatted string of the messages">
                            <input type="checkbox" v-model="showFormatted"> show formatted data
                        </label>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <button class="btn btn-default btn-sm hint--right hint--rounded" @click="previewMessage()" disabled={{message===""}} v-show="!isPreview" data-hint="preview the message to check format">preview message</button>
                        <button class="btn btn-default btn-sm hint--right hint--rounded" @click="cancelPreview()" disabled={{message===""}} v-else data-hint="cancel the preview of the message">cancel preview</button>
                        <button class="btn btn-primary btn-sm tour-send-message hint--right hint--rounded" @click="sendMessage()" disabled={{!websocket}} data-hint="press this button to send the message">send message</button>
                        <button class="btn btn-default btn-sm hint--right hint--rounded" @click="clear()" disabled={{messages.length===0}} data-hint="press this button to clear all the messages below">clear</button>
                        <button class="btn btn-default btn-sm" @click="savingAsBookmark()">{{isEditing ? "cancel" : "save as bookmark"}}</button>
                    </div>
                </div>
                <div class="row" v-show="isEditing">
                    <div class="col-md-4 hint--right hint--rounded" data-hint="input the bookmark name">
                        <input id="bookmarkName" type="text" class="form-control input-sm" v-model="bookmarkName">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-link btn-sm" @click="saveAsBookmark()" disabled={{!canSaveAsBookmark}}>save</button>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12 tour-view-messages">
                        <ul v-for="message in messages">
                            <li>
                                <span class="label label-default">{{message.moment}}</span>
                                <span v-if="message.type==='open'" class="label label-success">connected</span>
                                <span v-if="message.type==='close'" class="label label-danger">disconnected</span>
                                <span v-if="message.type==='error'" class="label label-danger">errored</span>
                                <span v-if="message.type==='out'" class="label label-info">out</span>
                                <span v-if="message.type==='message'" class="label label-info">in</span>
                                <span v-if="message.type==='tips'" class="label label-info">tips</span>
                                <span v-if="message.reason">{{message.reason}}</span>
                                <span v-if="message.data">{{message.data}}</span>
                                <span v-if="message.formattedData">
                                    <pre v-if="showFormatted">{{message.formattedData}}</pre>
                                    <span v-else class="label label-default">formatted</span>
                                </span>
                                <span v-if="message.rawData">
                                    <pre v-if="showRaw">{{message.rawData}}</pre>
                                    <span v-else class="label label-default">raw</span>
                                </span>
                                <pre v-if="message.tips">{{message.tips}}</pre>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `,
})
class App {
    public websocket: WebSocket | undefined;
    public messages: Message[];
    public isSocketIOInternally: boolean;
    public ignorePingInternally: boolean;
    public baseUrl: string;
    public parameters: Parameter[];
    public anchor: string;
    public messageInternally: string;
    public showRawInternally: boolean;
    public showFormattedInternally: boolean;
    public previewResult: string;
    public isPreview: boolean;
    public bookmarks: Bookmark[];
    public isEditing: boolean;
    public bookmarkName: string;

    constructor(options: any) { /** nothing */ }

    public data() {
        return {
            websocket: undefined,
            messages: [],
            isSocketIOInternally: !!localStorage.getItem("isSocketIO"),
            ignorePingInternally: !!localStorage.getItem("ignorePing"),
            baseUrl: localStorage.getItem("baseUrl") || "ws://slack.socket.io/socket.io/?transport=websocket",
            parameters: parameters ? JSON.parse(parameters) : [],
            anchor: localStorage.getItem("anchor") || "",
            messageInternally: localStorage.getItem("message") || "42[\"new message\",{\"username\":\"hello\",\"message\":\"world\"}]",
            showRawInternally: !!localStorage.getItem("showRaw"),
            showFormattedInternally: !!localStorage.getItem("showFormatted"),
            previewResult: "",
            isPreview: false,
            bookmarks: bookmarks ? JSON.parse(bookmarks) : [],
            isEditing: false,
            bookmarkName: "",
        };
    }

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
        Vue.nextTick(function () {
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
    });
});

previewDecoder.on("decoded", (decodedPacket: any) => {
    app.previewResult = JSON.stringify(decodedPacket, null, "    ");
});
