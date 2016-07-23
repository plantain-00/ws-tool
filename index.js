new Clipboard(".clipboard");
var pingId;
var parser = require("socket.io-parser");
var decoder = new parser.Decoder();
var previewDecoder = new parser.Decoder();
var parameters = localStorage.getItem("parameters");
var bookmarks = localStorage.getItem("bookmarks");

if (!localStorage.getItem("tour")) {
    var tour = new Shepherd.Tour({
        defaults: {
            classes: "shepherd-theme-arrows",
            showCancelLink: true
        }
    });

    tour.addStep("input url", {
        title: "input url",
        text: "input url of your websocket services here",
        attachTo: ".tour-input-url bottom",
        buttons: [
            {
                text: "Next",
                action: tour.next
            }
        ]
    });
    tour.addStep("check", {
        title: "check",
        text: "check this if you are connecting a socket.io service",
        attachTo: ".tour-check right",
        buttons: [
            {
                text: "Next",
                action: tour.next
            }
        ]
    });
    tour.addStep("connect", {
        title: "connect",
        text: "press this button to connect your websocket service",
        attachTo: ".tour-connect right",
        buttons: [
            {
                text: "Next",
                action: tour.next
            }
        ]
    });
    tour.addStep("input message", {
        title: "input message",
        text: "input message that is about to send",
        attachTo: ".tour-input-message right",
        buttons: [
            {
                text: "Next",
                action: tour.next
            }
        ]
    });
    tour.addStep("send message", {
        title: "send message",
        text: "press this button to send the message",
        attachTo: ".tour-send-message right",
        buttons: [
            {
                text: "Next",
                action: tour.next
            }
        ]
    });
    tour.addStep("view messages", {
        title: "view messages",
        text: "all the messages in and out will be here",
        attachTo: ".tour-view-messages top",
        buttons: [
            {
                text: "Done",
                action: tour.next
            }
        ]
    });

    tour.start();
    localStorage.setItem("tour", 1);
}

function getNow() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();
    return (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
}

vue = new Vue({
    el: "#body",
    data: {
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
    },
    computed: {
        canSaveAsBookmark: {
            get: function () {
                if (this.bookmarkName.trim() === "") {
                    return false;
                }
                for (var i = 0; i > this.bookmarks.length; i++) {
                    if (this.bookmarks[i].name === this.bookmarkName) {
                        return false;
                    }
                }
                return true;
            },
        },
        isSocketIO: {
            get: function () {
                return this.isSocketIOInternally;
            },
            set: function (value) {
                localStorage.setItem("isSocketIO", value ? "1" : "");
                this.isSocketIOInternally = value;
            }
        },
        ignorePing: {
            get: function () {
                return this.ignorePingInternally;
            },
            set: function (value) {
                localStorage.setItem("ignorePing", value ? "1" : "");
                this.ignorePingInternally = value;
            }
        },
        showRaw: {
            get: function () {
                return this.showRawInternally;
            },
            set: function (value) {
                localStorage.setItem("showRaw", value ? "1" : "");
                this.showRawInternally = value;
            }
        },
        showFormatted: {
            get: function () {
                return this.showFormattedInternally;
            },
            set: function (value) {
                localStorage.setItem("showFormatted", value ? "1" : "");
                this.showFormattedInternally = value;
            }
        },
        message: {
            get: function () {
                return this.messageInternally;
            },
            set: function (value) {
                localStorage.setItem("message", value);
                this.messageInternally = value;
            }
        },
        url: {
            get: function () {
                var url = this.baseUrl;
                if (this.parameters.length > 0) {
                    url += "?";
                    for (var i = 0; i < this.parameters.length; i++) {
                        var parameter = this.parameters[i];
                        url += parameter.key + "=" + parameter.value + "&";
                    }
                    url = url.substring(0, url.length - 1);
                }
                if (this.anchor) {
                    url += "#" + this.anchor;
                }
                return url;
            },
            set: function (url) {
                var index = url.indexOf("#");
                if (index > -1) {
                    url = url.substring(0, index);
                    this.anchor = url.substring(index + 1);
                } else {
                    this.anchor = "";
                }

                index = url.indexOf("?");
                if (index > -1) {
                    this.baseUrl = url.substring(0, index);
                    var array = url.substring(index + 1).split("&");
                    var parameters = [];
                    for (var i = 0; i < array.length; i++) {
                        var tmp = array[i];
                        index = tmp.indexOf("=");
                        if (index === -1) {
                            parameters.push({
                                key: tmp,
                                value: ""
                            });
                        } else {
                            parameters.push({
                                key: tmp.substring(0, index),
                                value: tmp.substring(index + 1)
                            });
                        }
                    }
                    this.parameters = parameters;
                } else {
                    this.baseUrl = url;
                    this.parameters = [];
                }

                localStorage.setItem("baseUrl", this.baseUrl);
                localStorage.setItem("parameters", JSON.stringify(this.parameters));
                localStorage.setItem("anchor", this.anchor);
            }
        }
    },
    methods: {
        savingAsBookmark: function () {
            this.isEditing = !this.isEditing;
            Vue.nextTick(function () {
                document.getElementById("bookmarkName").focus();
            });
        },
        saveAsBookmark: function () {
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
        },
        deleteBookmark: function (index) {
            this.bookmarks.splice(index, 1);
            localStorage.setItem("bookmarks", JSON.stringify(this.bookmarks));
        },
        useBookmark: function (index) {
            var bookmark = this.bookmarks[index];
            this.isSocketIO = bookmark.isSocketIO;
            this.ignorePing = bookmark.ignorePing;
            this.showRaw = bookmark.showRaw;
            this.showFormatted = bookmark.showFormatted;
            this.message = bookmark.message;
            this.baseUrl = bookmark.baseUrl;
            var parameters = JSON.stringify(bookmark.parameters);
            this.parameters = JSON.parse(parameters);
            this.anchor = bookmark.anchor;
            localStorage.setItem("baseUrl", bookmark.baseUrl);
            localStorage.setItem("parameters", parameters);
            localStorage.setItem("anchor", bookmark.anchor);
        },
        setParameter: function (index, key, value) {
            this.parameters[index].key = key;
            this.parameters[index].value = value;
            localStorage.setItem("parameters", JSON.stringify(this.parameters));
        },
        deleteParameter: function (index) {
            this.parameters.splice(index, 1);
            localStorage.setItem("parameters", JSON.stringify(this.parameters));
        },
        addParameter: function () {
            this.parameters.push({
                key: "",
                value: ""
            });
        },
        connect: function () {
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
        },
        sendMessage: function () {
            this.send(this.message);
        },
        send: function (message) {
            if (this.websocket) {
                if (!this.ignorePing || message !== "2") {
                    this.messages.unshift({
                        moment: getNow(),
                        type: "out",
                        data: message
                    });
                }
                this.websocket.send(message);
            }
        },
        ping: function () {
            this.send("2");
        },
        clear: function () {
            this.messages = [];
        },
        previewMessage: function () {
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
        },
        cancelPreview: function () {
            this.isPreview = false;
        },
        showTips: function () {
            this.messages.unshift({
                moment: getNow(),
                type: "tips",
                tips: "Tips: \n" +
                "1. for socket.io, if you connect http://localhost, in ws's perspective, you connected ws://localhost/socket.io/?transport=websocket\n" +
                "2. for socket.io, if you connect https://localhost, in ws's perspective, you connected wss://localhost/socket.io/?transport=websocket\n" +
                "3. for socket.io, if you send a message(eg: {a_key:\"a_value\"}) in an event(eg: \"a_event\"), in ws's perspective, the actual message you send is: 42[\"a_event\",{\"a_key\":\"a_value\"}]\n" +
                "4. chrome's developer tool is a good tool to view ws connection and messages"
            });
        },
        close: function () {
            this.messages.unshift({
                moment: getNow(),
                type: "tips",
                tips: "Is going to disconnect manually."
            });
            this.websocket.close();
        },
        onopen: function (e) {
            this.messages.unshift({
                moment: getNow(),
                type: e.type
            });
        },
        onclose: function (e) {
            this.messages.unshift({
                moment: getNow(),
                type: e.type,
                reason: e.reason
            });
            this.websocket = undefined;
            clearInterval(pingId);
        },
        onmessage: function (e) {
            if (this.ignorePing && e.data === "3") {
                return;
            }

            if (e.data === "3") {
                this.messages.unshift({
                    moment: getNow(),
                    type: e.type,
                    data: e.data
                });
                return;
            }

            vue.messages.unshift({
                moment: getNow(),
                type: e.type,
                rawData: e.data
            });

            if (this.isSocketIOInternally) {
                decoder.add(e.data);
            } else {
                try {
                    var json = JSON.parse(e.data);
                    this.messages.unshift({
                        moment: getNow(),
                        type: e.type,
                        formattedData: json
                    });
                } catch (error) {
                    console.log(error);
                }
            }
        },
        onerror: function (e) {
            this.messages.unshift({
                moment: getNow(),
                type: e.type,
            });
            this.websocket = undefined;
            clearInterval(pingId);
        }
    }
});

if (!window.WebSocket) {
    vue.messages.unshift({
        moment: getNow(),
        type: "tips",
        tips: "current browser doesn't support WebSocket"
    });
}

decoder.on("decoded", function (decodedPacket) {
    vue.messages.unshift({
        moment: getNow(),
        type: "message",
        formattedData: JSON.stringify(decodedPacket, null, "    ")
    });
});

previewDecoder.on("decoded", function (decodedPacket) {
    vue.previewResult = JSON.stringify(decodedPacket, null, "    ");
});
