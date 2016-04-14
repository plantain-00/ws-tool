new Clipboard('.clipboard');

var pingId;

var vue = new Vue({
    el: "#body",
    data: {
        websocket: undefined,
        url: "ws://echo.websocket.org/",
        messages: [],
        isSocketIO: false,
        ignorePing: false
    },
    methods: {
        connect: function() {
            this.websocket = new WebSocket(this.url);
            this.websocket.onopen = this.onopen;
            this.websocket.onclose = this.onclose;
            this.websocket.onmessage = this.onmessage;
            this.websocket.onerror = this.onerror;
            if (this.isSocketIO) {
                pingId = setInterval(this.ping, 25000);
            }
        },
        send: function(message) {
            if (this.websocket) {
                if (!this.ignorePing || message !== "2") {
                    vue.messages.unshift({
                        moment: moment().format("HH:mm:ss"),
                        type: "out",
                        data: message
                    });
                }
                this.websocket.send(message);
            }
        },
        ping: function() {
            this.send("2");
        },
        clear: function() {
            this.messages = [];
        },
        onopen: function(e) {
            vue.messages.unshift({
                moment: moment().format("HH:mm:ss"),
                type: e.type
            });
        },
        onclose: function(e) {
            vue.messages.unshift({
                moment: moment().format("HH:mm:ss"),
                type: e.type,
                reason: e.reason
            });
            this.websocket = undefined;
            clearInterval(pingId);
        },
        onmessage: function(e) {
            if (!this.ignorePing || message !== "3") {
                vue.messages.unshift({
                    moment: moment().format("HH:mm:ss"),
                    type: e.type,
                    data: e.data
                });
            }
        },
        onerror: function(e) {
            vue.messages.unshift({
                moment: moment().format("HH:mm:ss"),
                type: e.type
            });
            this.websocket = undefined;
            clearInterval(pingId);
        }
    }
});
