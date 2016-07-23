!function(e){function t(n){if(r[n])return r[n].exports;var s=r[n]={exports:{},id:n,loaded:!1};return e[n].call(s.exports,s,s.exports,t),s.loaded=!0,s.exports}var r={};return t.m=e,t.c=r,t.p="",t(0)}([function(e,t,r){function n(){var e=new Date,t=e.getHours(),r=e.getMinutes(),n=e.getSeconds();return(10>t?"0"+t:t)+":"+(10>r?"0"+r:r)+":"+(10>n?"0"+n:n)}new Clipboard(".clipboard");var s,o=r(1),a=new o.Decoder,i=new o.Decoder,c=localStorage.getItem("parameters"),l=localStorage.getItem("bookmarks");if(!localStorage.getItem("tour")){var u=new Shepherd.Tour({defaults:{classes:"shepherd-theme-arrows",showCancelLink:!0}});u.addStep("input url",{title:"input url",text:"input url of your websocket services here",attachTo:".tour-input-url bottom",buttons:[{text:"Next",action:u.next}]}),u.addStep("check",{title:"check",text:"check this if you are connecting a socket.io service",attachTo:".tour-check right",buttons:[{text:"Next",action:u.next}]}),u.addStep("connect",{title:"connect",text:"press this button to connect your websocket service",attachTo:".tour-connect right",buttons:[{text:"Next",action:u.next}]}),u.addStep("input message",{title:"input message",text:"input message that is about to send",attachTo:".tour-input-message right",buttons:[{text:"Next",action:u.next}]}),u.addStep("send message",{title:"send message",text:"press this button to send the message",attachTo:".tour-send-message right",buttons:[{text:"Next",action:u.next}]}),u.addStep("view messages",{title:"view messages",text:"all the messages in and out will be here",attachTo:".tour-view-messages top",buttons:[{text:"Done",action:u.next}]}),u.start(),localStorage.setItem("tour",1)}vue=new Vue({el:"#body",data:{websocket:void 0,messages:[],isSocketIOInternally:!!localStorage.getItem("isSocketIO"),ignorePingInternally:!!localStorage.getItem("ignorePing"),baseUrl:localStorage.getItem("baseUrl")||"ws://slack.socket.io/socket.io/?transport=websocket",parameters:c?JSON.parse(c):[],anchor:localStorage.getItem("anchor")||"",messageInternally:localStorage.getItem("message")||'42["new message",{"username":"hello","message":"world"}]',showRawInternally:!!localStorage.getItem("showRaw"),showFormattedInternally:!!localStorage.getItem("showFormatted"),previewResult:"",isPreview:!1,bookmarks:l?JSON.parse(l):[],isEditing:!1,bookmarkName:""},computed:{canSaveAsBookmark:{get:function(){if(""===this.bookmarkName.trim())return!1;for(var e=0;e>this.bookmarks.length;e++)if(this.bookmarks[e].name===this.bookmarkName)return!1;return!0}},isSocketIO:{get:function(){return this.isSocketIOInternally},set:function(e){localStorage.setItem("isSocketIO",e?"1":""),this.isSocketIOInternally=e}},ignorePing:{get:function(){return this.ignorePingInternally},set:function(e){localStorage.setItem("ignorePing",e?"1":""),this.ignorePingInternally=e}},showRaw:{get:function(){return this.showRawInternally},set:function(e){localStorage.setItem("showRaw",e?"1":""),this.showRawInternally=e}},showFormatted:{get:function(){return this.showFormattedInternally},set:function(e){localStorage.setItem("showFormatted",e?"1":""),this.showFormattedInternally=e}},message:{get:function(){return this.messageInternally},set:function(e){localStorage.setItem("message",e),this.messageInternally=e}},url:{get:function(){var e=this.baseUrl;if(this.parameters.length>0){e+="?";for(var t=0;t<this.parameters.length;t++){var r=this.parameters[t];e+=r.key+"="+r.value+"&"}e=e.substring(0,e.length-1)}return this.anchor&&(e+="#"+this.anchor),e},set:function(e){var t=e.indexOf("#");if(t>-1?(e=e.substring(0,t),this.anchor=e.substring(t+1)):this.anchor="",t=e.indexOf("?"),t>-1){this.baseUrl=e.substring(0,t);for(var r=e.substring(t+1).split("&"),n=[],s=0;s<r.length;s++){var o=r[s];t=o.indexOf("="),-1===t?n.push({key:o,value:""}):n.push({key:o.substring(0,t),value:o.substring(t+1)})}this.parameters=n}else this.baseUrl=e,this.parameters=[];localStorage.setItem("baseUrl",this.baseUrl),localStorage.setItem("parameters",JSON.stringify(this.parameters)),localStorage.setItem("anchor",this.anchor)}}},methods:{savingAsBookmark:function(){this.isEditing=!this.isEditing,Vue.nextTick(function(){document.getElementById("bookmarkName").focus()})},saveAsBookmark:function(){this.isEditing=!1,this.bookmarks.unshift({name:this.bookmarkName,isSocketIO:this.isSocketIO,ignorePing:this.ignorePing,baseUrl:this.baseUrl,parameters:this.parameters,anchor:this.anchor,message:this.message,showRaw:this.showRaw,showFormatted:this.showFormatted}),localStorage.setItem("bookmarks",JSON.stringify(this.bookmarks))},deleteBookmark:function(e){this.bookmarks.splice(e,1),localStorage.setItem("bookmarks",JSON.stringify(this.bookmarks))},useBookmark:function(e){var t=this.bookmarks[e];this.isSocketIO=t.isSocketIO,this.ignorePing=t.ignorePing,this.showRaw=t.showRaw,this.showFormatted=t.showFormatted,this.message=t.message,this.baseUrl=t.baseUrl;var r=JSON.stringify(t.parameters);this.parameters=JSON.parse(r),this.anchor=t.anchor,localStorage.setItem("baseUrl",t.baseUrl),localStorage.setItem("parameters",r),localStorage.setItem("anchor",t.anchor)},setParameter:function(e,t,r){this.parameters[e].key=t,this.parameters[e].value=r,localStorage.setItem("parameters",JSON.stringify(this.parameters))},deleteParameter:function(e){this.parameters.splice(e,1),localStorage.setItem("parameters",JSON.stringify(this.parameters))},addParameter:function(){this.parameters.push({key:"",value:""})},connect:function(){try{this.websocket=new WebSocket(this.url)}catch(e){return void this.messages.unshift({moment:n(),type:"error",reason:e.message})}this.websocket.onopen=this.onopen,this.websocket.onclose=this.onclose,this.websocket.onmessage=this.onmessage,this.websocket.onerror=this.onerror,this.isSocketIO&&(s=setInterval(this.ping,25e3))},sendMessage:function(){this.send(this.message)},send:function(e){this.websocket&&(this.ignorePing&&"2"===e||this.messages.unshift({moment:n(),type:"out",data:e}),this.websocket.send(e))},ping:function(){this.send("2")},clear:function(){this.messages=[]},previewMessage:function(){if(this.isPreview=!0,this.isSocketIO)this.previewResult="",i.add(this.message);else try{this.previewResult=JSON.stringify(JSON.parse(this.message),null,"    ")}catch(e){this.previewResult=e}},cancelPreview:function(){this.isPreview=!1},showTips:function(){this.messages.unshift({moment:n(),type:"tips",tips:'Tips: \n1. for socket.io, if you connect http://localhost, in ws\'s perspective, you connected ws://localhost/socket.io/?transport=websocket\n2. for socket.io, if you connect https://localhost, in ws\'s perspective, you connected wss://localhost/socket.io/?transport=websocket\n3. for socket.io, if you send a message(eg: {a_key:"a_value"}) in an event(eg: "a_event"), in ws\'s perspective, the actual message you send is: 42["a_event",{"a_key":"a_value"}]\n4. chrome\'s developer tool is a good tool to view ws connection and messages'})},close:function(){this.messages.unshift({moment:n(),type:"tips",tips:"Is going to disconnect manually."}),this.websocket.close()},onopen:function(e){this.messages.unshift({moment:n(),type:e.type})},onclose:function(e){this.messages.unshift({moment:n(),type:e.type,reason:e.reason}),this.websocket=void 0,clearInterval(s)},onmessage:function(e){if(!this.ignorePing||"3"!==e.data){if("3"===e.data)return void this.messages.unshift({moment:n(),type:e.type,data:e.data});if(vue.messages.unshift({moment:n(),type:e.type,rawData:e.data}),this.isSocketIOInternally)a.add(e.data);else try{var t=JSON.parse(e.data);this.messages.unshift({moment:n(),type:e.type,formattedData:t})}catch(r){console.log(r)}}},onerror:function(e){this.messages.unshift({moment:n(),type:e.type}),this.websocket=void 0,clearInterval(s)}}}),window.WebSocket||vue.messages.unshift({moment:n(),type:"tips",tips:"current browser doesn't support WebSocket"}),a.on("decoded",function(e){vue.messages.unshift({moment:n(),type:"message",formattedData:JSON.stringify(e,null,"    ")})}),i.on("decoded",function(e){vue.previewResult=JSON.stringify(e,null,"    ")})},function(e,t,r){function n(){}function s(e){var r="",n=!1;return r+=e.type,t.BINARY_EVENT!=e.type&&t.BINARY_ACK!=e.type||(r+=e.attachments,r+="-"),e.nsp&&"/"!=e.nsp&&(n=!0,r+=e.nsp),null!=e.id&&(n&&(r+=",",n=!1),r+=e.id),null!=e.data&&(n&&(r+=","),r+=f.stringify(e.data)),u("encoded %j as %s",e,r),r}function o(e,t){function r(e){var r=p.deconstructPacket(e),n=s(r.packet),o=r.buffers;o.unshift(n),t(o)}p.removeBlobs(e,r)}function a(){this.reconstructor=null}function i(e){var r={},n=0;if(r.type=Number(e.charAt(0)),null==t.types[r.type])return l();if(t.BINARY_EVENT==r.type||t.BINARY_ACK==r.type){for(var s="";"-"!=e.charAt(++n)&&(s+=e.charAt(n),n!=e.length););if(s!=Number(s)||"-"!=e.charAt(n))throw new Error("Illegal attachments");r.attachments=Number(s)}if("/"==e.charAt(n+1))for(r.nsp="";++n;){var o=e.charAt(n);if(","==o)break;if(r.nsp+=o,n==e.length)break}else r.nsp="/";var a=e.charAt(n+1);if(""!==a&&Number(a)==a){for(r.id="";++n;){var o=e.charAt(n);if(null==o||Number(o)!=o){--n;break}if(r.id+=e.charAt(n),n==e.length)break}r.id=Number(r.id)}if(e.charAt(++n))try{r.data=f.parse(e.substr(n))}catch(i){return l()}return u("decoded %s as %j",e,r),r}function c(e){this.reconPack=e,this.buffers=[]}function l(e){return{type:t.ERROR,data:"parser error"}}var u=r(2)("socket.io-parser"),f=r(5),h=(r(8),r(9)),p=r(10),g=r(11);t.protocol=4,t.types=["CONNECT","DISCONNECT","EVENT","ACK","ERROR","BINARY_EVENT","BINARY_ACK"],t.CONNECT=0,t.DISCONNECT=1,t.EVENT=2,t.ACK=3,t.ERROR=4,t.BINARY_EVENT=5,t.BINARY_ACK=6,t.Encoder=n,t.Decoder=a,n.prototype.encode=function(e,r){if(u("encoding packet %j",e),t.BINARY_EVENT==e.type||t.BINARY_ACK==e.type)o(e,r);else{var n=s(e);r([n])}},h(a.prototype),a.prototype.add=function(e){var r;if("string"==typeof e)r=i(e),t.BINARY_EVENT==r.type||t.BINARY_ACK==r.type?(this.reconstructor=new c(r),0===this.reconstructor.reconPack.attachments&&this.emit("decoded",r)):this.emit("decoded",r);else{if(!g(e)&&!e.base64)throw new Error("Unknown type: "+e);if(!this.reconstructor)throw new Error("got binary data when not reconstructing a packet");r=this.reconstructor.takeBinaryData(e),r&&(this.reconstructor=null,this.emit("decoded",r))}},a.prototype.destroy=function(){this.reconstructor&&this.reconstructor.finishedReconstruction()},c.prototype.takeBinaryData=function(e){if(this.buffers.push(e),this.buffers.length==this.reconPack.attachments){var t=p.reconstructPacket(this.reconPack,this.buffers);return this.finishedReconstruction(),t}return null},c.prototype.finishedReconstruction=function(){this.reconPack=null,this.buffers=[]}},function(e,t,r){function n(){return"WebkitAppearance"in document.documentElement.style||window.console&&(console.firebug||console.exception&&console.table)||navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)&&parseInt(RegExp.$1,10)>=31}function s(){var e=arguments,r=this.useColors;if(e[0]=(r?"%c":"")+this.namespace+(r?" %c":" ")+e[0]+(r?"%c ":" ")+"+"+t.humanize(this.diff),!r)return e;var n="color: "+this.color;e=[e[0],n,"color: inherit"].concat(Array.prototype.slice.call(e,1));var s=0,o=0;return e[0].replace(/%[a-z%]/g,function(e){"%%"!==e&&(s++,"%c"===e&&(o=s))}),e.splice(o,0,n),e}function o(){return"object"==typeof console&&console.log&&Function.prototype.apply.call(console.log,console,arguments)}function a(e){try{null==e?t.storage.removeItem("debug"):t.storage.debug=e}catch(r){}}function i(){var e;try{e=t.storage.debug}catch(r){}return e}function c(){try{return window.localStorage}catch(e){}}t=e.exports=r(3),t.log=o,t.formatArgs=s,t.save=a,t.load=i,t.useColors=n,t.storage="undefined"!=typeof chrome&&"undefined"!=typeof chrome.storage?chrome.storage.local:c(),t.colors=["lightseagreen","forestgreen","goldenrod","dodgerblue","darkorchid","crimson"],t.formatters.j=function(e){return JSON.stringify(e)},t.enable(i())},function(e,t,r){function n(){return t.colors[u++%t.colors.length]}function s(e){function r(){}function s(){var e=s,r=+new Date,o=r-(l||r);e.diff=o,e.prev=l,e.curr=r,l=r,null==e.useColors&&(e.useColors=t.useColors()),null==e.color&&e.useColors&&(e.color=n());var a=Array.prototype.slice.call(arguments);a[0]=t.coerce(a[0]),"string"!=typeof a[0]&&(a=["%o"].concat(a));var i=0;a[0]=a[0].replace(/%([a-z%])/g,function(r,n){if("%%"===r)return r;i++;var s=t.formatters[n];if("function"==typeof s){var o=a[i];r=s.call(e,o),a.splice(i,1),i--}return r}),"function"==typeof t.formatArgs&&(a=t.formatArgs.apply(e,a));var c=s.log||t.log||console.log.bind(console);c.apply(e,a)}r.enabled=!1,s.enabled=!0;var o=t.enabled(e)?s:r;return o.namespace=e,o}function o(e){t.save(e);for(var r=(e||"").split(/[\s,]+/),n=r.length,s=0;n>s;s++)r[s]&&(e=r[s].replace(/\*/g,".*?"),"-"===e[0]?t.skips.push(new RegExp("^"+e.substr(1)+"$")):t.names.push(new RegExp("^"+e+"$")))}function a(){t.enable("")}function i(e){var r,n;for(r=0,n=t.skips.length;n>r;r++)if(t.skips[r].test(e))return!1;for(r=0,n=t.names.length;n>r;r++)if(t.names[r].test(e))return!0;return!1}function c(e){return e instanceof Error?e.stack||e.message:e}t=e.exports=s,t.coerce=c,t.disable=a,t.enable=o,t.enabled=i,t.humanize=r(4),t.names=[],t.skips=[],t.formatters={};var l,u=0},function(e,t){function r(e){if(e=""+e,!(e.length>1e4)){var t=/^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(e);if(t){var r=parseFloat(t[1]),n=(t[2]||"ms").toLowerCase();switch(n){case"years":case"year":case"yrs":case"yr":case"y":return r*u;case"days":case"day":case"d":return r*l;case"hours":case"hour":case"hrs":case"hr":case"h":return r*c;case"minutes":case"minute":case"mins":case"min":case"m":return r*i;case"seconds":case"second":case"secs":case"sec":case"s":return r*a;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return r}}}}function n(e){return e>=l?Math.round(e/l)+"d":e>=c?Math.round(e/c)+"h":e>=i?Math.round(e/i)+"m":e>=a?Math.round(e/a)+"s":e+"ms"}function s(e){return o(e,l,"day")||o(e,c,"hour")||o(e,i,"minute")||o(e,a,"second")||e+" ms"}function o(e,t,r){return t>e?void 0:1.5*t>e?Math.floor(e/t)+" "+r:Math.ceil(e/t)+" "+r+"s"}var a=1e3,i=60*a,c=60*i,l=24*c,u=365.25*l;e.exports=function(e,t){return t=t||{},"string"==typeof e?r(e):t["long"]?s(e):n(e)}},function(e,t,r){var n;(function(e,s){(function(){function o(e,t){function r(e){if(r[e]!==d)return r[e];var o;if("bug-string-char-index"==e)o="a"!="a"[0];else if("json"==e)o=r("json-stringify")&&r("json-parse");else{var a,i='{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';if("json-stringify"==e){var l=t.stringify,u="function"==typeof l&&v;if(u){(a=function(){return 1}).toJSON=a;try{u="0"===l(0)&&"0"===l(new n)&&'""'==l(new s)&&l(b)===d&&l(d)===d&&l()===d&&"1"===l(a)&&"[1]"==l([a])&&"[null]"==l([d])&&"null"==l(null)&&"[null,null,null]"==l([d,b,null])&&l({a:[a,!0,!1,null,"\x00\b\n\f\r	"]})==i&&"1"===l(null,a)&&"[\n 1,\n 2\n]"==l([1,2],null,1)&&'"-271821-04-20T00:00:00.000Z"'==l(new c(-864e13))&&'"+275760-09-13T00:00:00.000Z"'==l(new c(864e13))&&'"-000001-01-01T00:00:00.000Z"'==l(new c(-621987552e5))&&'"1969-12-31T23:59:59.999Z"'==l(new c(-1))}catch(f){u=!1}}o=u}if("json-parse"==e){var h=t.parse;if("function"==typeof h)try{if(0===h("0")&&!h(!1)){a=h(i);var p=5==a.a.length&&1===a.a[0];if(p){try{p=!h('"	"')}catch(f){}if(p)try{p=1!==h("01")}catch(f){}if(p)try{p=1!==h("1.")}catch(f){}}}}catch(f){p=!1}o=p}}return r[e]=!!o}e||(e=l.Object()),t||(t=l.Object());var n=e.Number||l.Number,s=e.String||l.String,a=e.Object||l.Object,c=e.Date||l.Date,u=e.SyntaxError||l.SyntaxError,f=e.TypeError||l.TypeError,h=e.Math||l.Math,p=e.JSON||l.JSON;"object"==typeof p&&p&&(t.stringify=p.stringify,t.parse=p.parse);var g,m,d,y=a.prototype,b=y.toString,v=new c(-0xc782b5b800cec);try{v=-109252==v.getUTCFullYear()&&0===v.getUTCMonth()&&1===v.getUTCDate()&&10==v.getUTCHours()&&37==v.getUTCMinutes()&&6==v.getUTCSeconds()&&708==v.getUTCMilliseconds()}catch(k){}if(!r("json")){var w="[object Function]",S="[object Date]",I="[object Number]",N="[object String]",A="[object Array]",O="[object Boolean]",C=r("bug-string-char-index");if(!v)var _=h.floor,x=[0,31,59,90,120,151,181,212,243,273,304,334],T=function(e,t){return x[t]+365*(e-1970)+_((e-1969+(t=+(t>1)))/4)-_((e-1901+t)/100)+_((e-1601+t)/400)};if((g=y.hasOwnProperty)||(g=function(e){var t,r={};return(r.__proto__=null,r.__proto__={toString:1},r).toString!=b?g=function(e){var t=this.__proto__,r=e in(this.__proto__=null,this);return this.__proto__=t,r}:(t=r.constructor,g=function(e){var r=(this.constructor||t).prototype;return e in this&&!(e in r&&this[e]===r[e])}),r=null,g.call(this,e)}),m=function(e,t){var r,n,s,o=0;(r=function(){this.valueOf=0}).prototype.valueOf=0,n=new r;for(s in n)g.call(n,s)&&o++;return r=n=null,o?m=2==o?function(e,t){var r,n={},s=b.call(e)==w;for(r in e)s&&"prototype"==r||g.call(n,r)||!(n[r]=1)||!g.call(e,r)||t(r)}:function(e,t){var r,n,s=b.call(e)==w;for(r in e)s&&"prototype"==r||!g.call(e,r)||(n="constructor"===r)||t(r);(n||g.call(e,r="constructor"))&&t(r)}:(n=["valueOf","toString","toLocaleString","propertyIsEnumerable","isPrototypeOf","hasOwnProperty","constructor"],m=function(e,t){var r,s,o=b.call(e)==w,a=!o&&"function"!=typeof e.constructor&&i[typeof e.hasOwnProperty]&&e.hasOwnProperty||g;for(r in e)o&&"prototype"==r||!a.call(e,r)||t(r);for(s=n.length;r=n[--s];a.call(e,r)&&t(r));}),m(e,t)},!r("json-stringify")){var E={92:"\\\\",34:'\\"',8:"\\b",12:"\\f",10:"\\n",13:"\\r",9:"\\t"},R="000000",j=function(e,t){return(R+(t||0)).slice(-e)},P="\\u00",B=function(e){for(var t='"',r=0,n=e.length,s=!C||n>10,o=s&&(C?e.split(""):e);n>r;r++){var a=e.charCodeAt(r);switch(a){case 8:case 9:case 10:case 12:case 13:case 34:case 92:t+=E[a];break;default:if(32>a){t+=P+j(2,a.toString(16));break}t+=s?o[r]:e.charAt(r)}}return t+'"'},J=function(e,t,r,n,s,o,a){var i,c,l,u,h,p,y,v,k,w,C,x,E,R,P,U;try{i=t[e]}catch(D){}if("object"==typeof i&&i)if(c=b.call(i),c!=S||g.call(i,"toJSON"))"function"==typeof i.toJSON&&(c!=I&&c!=N&&c!=A||g.call(i,"toJSON"))&&(i=i.toJSON(e));else if(i>-1/0&&1/0>i){if(T){for(h=_(i/864e5),l=_(h/365.2425)+1970-1;T(l+1,0)<=h;l++);for(u=_((h-T(l,0))/30.42);T(l,u+1)<=h;u++);h=1+h-T(l,u),p=(i%864e5+864e5)%864e5,y=_(p/36e5)%24,v=_(p/6e4)%60,k=_(p/1e3)%60,w=p%1e3}else l=i.getUTCFullYear(),u=i.getUTCMonth(),h=i.getUTCDate(),y=i.getUTCHours(),v=i.getUTCMinutes(),k=i.getUTCSeconds(),w=i.getUTCMilliseconds();i=(0>=l||l>=1e4?(0>l?"-":"+")+j(6,0>l?-l:l):j(4,l))+"-"+j(2,u+1)+"-"+j(2,h)+"T"+j(2,y)+":"+j(2,v)+":"+j(2,k)+"."+j(3,w)+"Z"}else i=null;if(r&&(i=r.call(t,e,i)),null===i)return"null";if(c=b.call(i),c==O)return""+i;if(c==I)return i>-1/0&&1/0>i?""+i:"null";if(c==N)return B(""+i);if("object"==typeof i){for(R=a.length;R--;)if(a[R]===i)throw f();if(a.push(i),C=[],P=o,o+=s,c==A){for(E=0,R=i.length;R>E;E++)x=J(E,i,r,n,s,o,a),C.push(x===d?"null":x);U=C.length?s?"[\n"+o+C.join(",\n"+o)+"\n"+P+"]":"["+C.join(",")+"]":"[]"}else m(n||i,function(e){var t=J(e,i,r,n,s,o,a);t!==d&&C.push(B(e)+":"+(s?" ":"")+t)}),U=C.length?s?"{\n"+o+C.join(",\n"+o)+"\n"+P+"}":"{"+C.join(",")+"}":"{}";return a.pop(),U}};t.stringify=function(e,t,r){var n,s,o,a;if(i[typeof t]&&t)if((a=b.call(t))==w)s=t;else if(a==A){o={};for(var c,l=0,u=t.length;u>l;c=t[l++],a=b.call(c),(a==N||a==I)&&(o[c]=1));}if(r)if((a=b.call(r))==I){if((r-=r%1)>0)for(n="",r>10&&(r=10);n.length<r;n+=" ");}else a==N&&(n=r.length<=10?r:r.slice(0,10));return J("",(c={},c[""]=e,c),s,o,n,"",[])}}if(!r("json-parse")){var U,D,F=s.fromCharCode,M={92:"\\",34:'"',47:"/",98:"\b",116:"	",110:"\n",102:"\f",114:"\r"},Y=function(){throw U=D=null,u()},V=function(){for(var e,t,r,n,s,o=D,a=o.length;a>U;)switch(s=o.charCodeAt(U)){case 9:case 10:case 13:case 32:U++;break;case 123:case 125:case 91:case 93:case 58:case 44:return e=C?o.charAt(U):o[U],U++,e;case 34:for(e="@",U++;a>U;)if(s=o.charCodeAt(U),32>s)Y();else if(92==s)switch(s=o.charCodeAt(++U)){case 92:case 34:case 47:case 98:case 116:case 110:case 102:case 114:e+=M[s],U++;break;case 117:for(t=++U,r=U+4;r>U;U++)s=o.charCodeAt(U),s>=48&&57>=s||s>=97&&102>=s||s>=65&&70>=s||Y();e+=F("0x"+o.slice(t,U));break;default:Y()}else{if(34==s)break;for(s=o.charCodeAt(U),t=U;s>=32&&92!=s&&34!=s;)s=o.charCodeAt(++U);e+=o.slice(t,U)}if(34==o.charCodeAt(U))return U++,e;Y();default:if(t=U,45==s&&(n=!0,s=o.charCodeAt(++U)),s>=48&&57>=s){for(48==s&&(s=o.charCodeAt(U+1),s>=48&&57>=s)&&Y(),n=!1;a>U&&(s=o.charCodeAt(U),s>=48&&57>=s);U++);if(46==o.charCodeAt(U)){for(r=++U;a>r&&(s=o.charCodeAt(r),s>=48&&57>=s);r++);r==U&&Y(),U=r}if(s=o.charCodeAt(U),101==s||69==s){for(s=o.charCodeAt(++U),43!=s&&45!=s||U++,r=U;a>r&&(s=o.charCodeAt(r),s>=48&&57>=s);r++);r==U&&Y(),U=r}return+o.slice(t,U)}if(n&&Y(),"true"==o.slice(U,U+4))return U+=4,!0;if("false"==o.slice(U,U+5))return U+=5,!1;if("null"==o.slice(U,U+4))return U+=4,null;Y()}return"$"},L=function(e){var t,r;if("$"==e&&Y(),"string"==typeof e){if("@"==(C?e.charAt(0):e[0]))return e.slice(1);if("["==e){for(t=[];e=V(),"]"!=e;r||(r=!0))r&&(","==e?(e=V(),"]"==e&&Y()):Y()),","==e&&Y(),t.push(L(e));return t}if("{"==e){for(t={};e=V(),"}"!=e;r||(r=!0))r&&(","==e?(e=V(),"}"==e&&Y()):Y()),","!=e&&"string"==typeof e&&"@"==(C?e.charAt(0):e[0])&&":"==V()||Y(),t[e.slice(1)]=L(V());return t}Y()}return e},K=function(e,t,r){var n=$(e,t,r);n===d?delete e[t]:e[t]=n},$=function(e,t,r){var n,s=e[t];if("object"==typeof s&&s)if(b.call(s)==A)for(n=s.length;n--;)K(s,n,r);else m(s,function(e){K(s,e,r)});return r.call(e,t,s)};t.parse=function(e,t){var r,n;return U=0,D=""+e,r=L(V()),"$"!=V()&&Y(),U=D=null,t&&b.call(t)==w?$((n={},n[""]=r,n),"",t):r}}}return t.runInContext=o,t}var a=r(7),i={"function":!0,object:!0},c=i[typeof t]&&t&&!t.nodeType&&t,l=i[typeof window]&&window||this,u=c&&i[typeof e]&&e&&!e.nodeType&&"object"==typeof s&&s;if(!u||u.global!==u&&u.window!==u&&u.self!==u||(l=u),c&&!a)o(l,c);else{var f=l.JSON,h=l.JSON3,p=!1,g=o(l,l.JSON3={noConflict:function(){return p||(p=!0,l.JSON=f,l.JSON3=h,f=h=null),g}});l.JSON={parse:g.parse,stringify:g.stringify}}a&&(n=function(){return g}.call(t,r,t,e),!(void 0!==n&&(e.exports=n)))}).call(this)}).call(t,r(6)(e),function(){return this}())},function(e,t){e.exports=function(e){return e.webpackPolyfill||(e.deprecate=function(){},e.paths=[],e.children=[],e.webpackPolyfill=1),e}},function(e,t){(function(t){e.exports=t}).call(t,{})},function(e,t){e.exports=Array.isArray||function(e){return"[object Array]"==Object.prototype.toString.call(e)}},function(e,t){function r(e){return e?n(e):void 0}function n(e){for(var t in r.prototype)e[t]=r.prototype[t];return e}e.exports=r,r.prototype.on=r.prototype.addEventListener=function(e,t){return this._callbacks=this._callbacks||{},(this._callbacks[e]=this._callbacks[e]||[]).push(t),this},r.prototype.once=function(e,t){function r(){n.off(e,r),t.apply(this,arguments)}var n=this;return this._callbacks=this._callbacks||{},r.fn=t,this.on(e,r),this},r.prototype.off=r.prototype.removeListener=r.prototype.removeAllListeners=r.prototype.removeEventListener=function(e,t){if(this._callbacks=this._callbacks||{},0==arguments.length)return this._callbacks={},this;var r=this._callbacks[e];if(!r)return this;if(1==arguments.length)return delete this._callbacks[e],this;for(var n,s=0;s<r.length;s++)if(n=r[s],n===t||n.fn===t){r.splice(s,1);break}return this},r.prototype.emit=function(e){this._callbacks=this._callbacks||{};var t=[].slice.call(arguments,1),r=this._callbacks[e];if(r){r=r.slice(0);for(var n=0,s=r.length;s>n;++n)r[n].apply(this,t)}return this},r.prototype.listeners=function(e){return this._callbacks=this._callbacks||{},this._callbacks[e]||[]},r.prototype.hasListeners=function(e){return!!this.listeners(e).length}},function(e,t,r){(function(e){var n=r(8),s=r(11);t.deconstructPacket=function(e){function t(e){if(!e)return e;if(s(e)){var o={_placeholder:!0,num:r.length};return r.push(e),o}if(n(e)){for(var a=new Array(e.length),i=0;i<e.length;i++)a[i]=t(e[i]);return a}if("object"==typeof e&&!(e instanceof Date)){var a={};for(var c in e)a[c]=t(e[c]);return a}return e}var r=[],o=e.data,a=e;return a.data=t(o),a.attachments=r.length,{packet:a,buffers:r}},t.reconstructPacket=function(e,t){function r(e){if(e&&e._placeholder){var s=t[e.num];return s}if(n(e)){for(var o=0;o<e.length;o++)e[o]=r(e[o]);return e}if(e&&"object"==typeof e){for(var a in e)e[a]=r(e[a]);return e}return e}return e.data=r(e.data),e.attachments=void 0,e},t.removeBlobs=function(t,r){function o(t,c,l){if(!t)return t;if(e.Blob&&t instanceof Blob||e.File&&t instanceof File){a++;var u=new FileReader;u.onload=function(){l?l[c]=this.result:i=this.result,--a||r(i)},u.readAsArrayBuffer(t)}else if(n(t))for(var f=0;f<t.length;f++)o(t[f],f,t);else if(t&&"object"==typeof t&&!s(t))for(var h in t)o(t[h],h,t)}var a=0,i=t;o(i),a||r(i)}}).call(t,function(){return this}())},function(e,t){(function(t){function r(e){return t.Buffer&&t.Buffer.isBuffer(e)||t.ArrayBuffer&&e instanceof ArrayBuffer}e.exports=r}).call(t,function(){return this}())}]);