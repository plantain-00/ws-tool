new Clipboard(".clipboard");
var pingId;
var parser = require("socket.io-parser");
var decoder = new parser.Decoder();

vue = new Vue({
    el: "#body",
    data: {
        websocket: undefined,
        messages: [],
        isSocketIOInternally: !!localStorage.getItem("isSocketIO"),
        ignorePingInternally: !!localStorage.getItem("ignorePing"),
        baseUrl: localStorage.getItem("baseUrl") || "ws://localhost",
        parameters: localStorage.getItem("parameters") ? JSON.parse(localStorage.getItem("parameters")) : [],
        anchor: localStorage.getItem("anchor") || "",
        messageInternally: localStorage.getItem("message") || "",
        showRawInternally: !!localStorage.getItem("showRaw"),
        showFormattedInternally: !!localStorage.getItem("showFormatted")
    },
    computed: {
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
            this.websocket = new WebSocket(this.url);
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
                        moment: moment().format("HH:mm:ss"),
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
        onopen: function (e) {
            this.messages.unshift({
                moment: moment().format("HH:mm:ss"),
                type: e.type
            });
        },
        onclose: function (e) {
            this.messages.unshift({
                moment: moment().format("HH:mm:ss"),
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
                    moment: moment().format("HH:mm:ss"),
                    type: e.type,
                    data: e.data
                });
                return;
            }

            vue.messages.unshift({
                moment: moment().format("HH:mm:ss"),
                type: e.type,
                rawData: e.data
            });

            if (this.isSocketIOInternally) {
                decoder.add(e.data);
            } else {
                try {
                    var json = JSON.parse(e.data);
                    this.messages.unshift({
                        moment: moment().format("HH:mm:ss"),
                        type: e.type,
                        formattedData: json
                    });
                } catch (error) { }
            }
        },
        onerror: function (e) {
            this.messages.unshift({
                moment: moment().format("HH:mm:ss"),
                type: e.type
            });
            this.websocket = undefined;
            clearInterval(pingId);
        }
    }
});

decoder.on("decoded", function (decodedPacket) {
    vue.messages.unshift({
        moment: moment().format("HH:mm:ss"),
        type: "message",
        formattedData: JSON.stringify(decodedPacket, null, "    ")
    });
});
