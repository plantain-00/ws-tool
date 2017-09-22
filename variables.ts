export const appTemplateHtml = `<div><ul class="bookmarks list-unstyled"><li v-for="(bookmark, index) in bookmarks"><button class="btn btn-link btn-xs" @click="useBookmark(index)">{{bookmark.name}}</button><button class="btn btn-link btn-xs" @click="deleteBookmark(index)">delete</button></li></ul><div class="main"><div class="container"><div class="row"><div class="col-md-12"><h1>WebSocket/Socket.IO/Stomp/Bayeux/HTTP/TCP/UDP/WebRTC/DNS Test Tool</h1></div></div><div class="row"><div class="col-md-12"><label><input type="radio" v-model="protocol" value="WebSocket" :disabled="isConnected"> WebSocket</label><label><input type="radio" v-model="protocol" value="HTTP" :disabled="isConnected"> HTTP</label><label><input type="radio" v-model="protocol" value="TCP" :disabled="isConnected"> TCP</label><label><input type="radio" v-model="protocol" value="UDP" :disabled="isConnected"> UDP</label><label><input type="radio" v-model="protocol" value="WebRTC" :disabled="isConnected"> WebRTC</label></div></div><div class="row" v-if="protocol === 'WebSocket' || protocol === 'HTTP'"><div class="col-md-10"><input id="url" type="url" class="form-control" v-model="url" placeholder="url"></div><div class="col-md-2" v-if="protocol === 'WebSocket'"><input type="text" class="form-control" placeholder="subprotocol" v-model="subprotocol"></div><div class="col-md-2" v-else><select class="form-control" v-model="httpMethod"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option><option>COPY</option><option>HEAD</option><option>OPTIONS</option><option>LINK</option><option>UNLINK</option><option>PURGE</option></select></div></div><div class="row" v-if="protocol === 'TCP' || protocol === 'UDP'"><div class="col-md-3"><input class="form-control" v-model="host" placeholder="host"></div><div class="col-md-2"><input type="number" class="form-control" placeholder="port" v-model="port"></div></div><div class="row" v-if="protocol === 'WebRTC'"><div class="col-md-3"><input type="text" class="form-control" placeholder="data channel" v-model="dataChannelName"></div><div class="col-md-3"><button class="btn btn-primary btn-sm" @click="createDataChannel()" :disabled="!dataChannelName || dataChannelStatus !== 'none' || !peerConnection">create data channel</button></div></div><div class="row" v-if="protocol === 'WebRTC'"><div class="col-md-12"><textarea style="width:100%;height:110px" class="form-control" placeholder="session description(offer or answer)" v-model="sessionDescription"></textarea></div></div><div class="row"><div class="col-md-12"><button class="btn btn-primary btn-sm" @click="connect()" v-if="protocol !== 'HTTP' && protocol !== 'UDP' && protocol !== 'WebRTC'" :disabled="isConnected">connect</button><button class="btn btn-default btn-sm" @click="close()" v-if="protocol !== 'HTTP' && protocol !== 'UDP' && protocol !== 'WebRTC'" :disabled="isDisconnected">disconnect</button><button class="btn btn-default btn-sm clipboard" data-clipboard-target="#url" v-if="protocol === 'WebSocket' || protocol === 'HTTP'">copy URL</button><button class="btn btn-default btn-sm" @click="addParameter()" v-if="protocol === 'WebSocket' || protocol === 'HTTP'">add a parameter</button><button class="btn btn-default btn-sm" @click="addHeader()" v-if="protocol === 'HTTP'">add a header</button><button class="btn btn-default btn-sm" @click="addFormData()" v-if="protocol === 'HTTP'">add a form data</button><button class="btn btn-primary btn-sm" @click="createOffer()" v-if="protocol === 'WebRTC'" :disabled="dataChannelStatus !== 'init' && dataChannelStatus !== 'created offer'">create offer</button><button class="btn btn-default btn-sm" @click="answerOffer()" v-if="protocol === 'WebRTC'" :disabled="(dataChannelStatus !== 'init' && dataChannelStatus !== 'answered offer') || !sessionDescription">answer offer</button><button class="btn btn-default btn-sm" @click="setAnswer()" v-if="protocol === 'WebRTC'" :disabled="dataChannelStatus !== 'created offer' || !sessionDescription">set answer</button><button class="btn btn-default btn-sm" @click="showTips()">show tips</button><button class="btn btn-default btn-sm" @click="toggleSocketIO()" v-if="protocol === 'WebSocket'">{{ socketIOIsHidden ? "show socket.io" : "hide socket.io"}}</button><button class="btn btn-default btn-sm" @click="toggleStomp()" v-if="protocol === 'WebSocket' || protocol === 'TCP'">{{ stompIsHidden ? "show stomp" : "hide stomp"}}</button><button class="btn btn-default btn-sm" @click="toggleBayeux()" v-if="protocol === 'WebSocket'">{{ bayeuxIsHidden ? "show bayeux" : "hide bayeux"}}</button><button class="btn btn-default btn-sm" @click="toggleProtobuf()" v-if="protocol !== 'HTTP'">{{ protobufIsHidden ? "show protobuf" : "hide protobuf"}}</button><button class="btn btn-default btn-sm" @click="toggleDNS()" v-if="protocol === 'UDP'">{{ dnsIsHidden ? "show DNS" : "hide DNS"}}</button></div></div><div class="row" v-if="!socketIOIsHidden && protocol === 'WebSocket'"><div class="col-md-12"><label><input type="checkbox" v-model="isSocketIO" :disabled="isConnected"> socket.io</label><label><input type="checkbox" v-model="ignorePing" :disabled="isConnected || !isSocketIO"> will hide ping/pong of socket.io</label><button class="btn btn-link btn-sm" @click="useSocketIOSendMessage()">use socket.io to send message</button></div></div><div class="row" v-if="!stompIsHidden && (protocol === 'WebSocket' || protocol === 'TCP')"><div class="col-md-12"><button class="btn btn-link btn-sm" @click="useStompConnectionMessage()">use stomp connection message</button><button class="btn btn-link btn-sm" @click="useStompSubscriptionMessage()">use stomp subscription message</button><button class="btn btn-link btn-sm" @click="useStompSendMessage()">use stomp send message</button></div></div><div class="row" v-if="!bayeuxIsHidden && protocol === 'WebSocket'"><div class="col-md-12"><button class="btn btn-link btn-sm" @click="useBayeuxHandshakeMessage()">use bayeux handshake message</button><button class="btn btn-link btn-sm" @click="useBayeuxSubscribeMessage()">use bayeux subscribe message</button><button class="btn btn-link btn-sm" @click="useBayeuxPublishMessage()">use bayeux publish message</button><button class="btn btn-link btn-sm" @click="useBayeuxPingMessage()">use bayeux ping message</button></div></div><div class="row"><div class="col-md-12" v-if="protocol !== 'HTTP' || shouldContainBody"><label v-if="protocol !== 'HTTP' || shouldContainBody"><input type="radio" v-model="messageType" value="string"> string</label><label v-if="protocol !== 'HTTP'"><input type="radio" v-model="messageType" value="Uint8Array"> Uint8Array</label><label v-if="protocol !== 'HTTP'"><input type="radio" v-model="messageType" value="protobuf"> protobuf</label><label v-if="protocol === 'HTTP' && shouldContainBody"><input type="radio" v-model="messageType" value="FormData"> FormData</label></div></div><div class="row" v-if="!protobufIsHidden"><div class="col-md-5"><textarea style="width:100%;height:150px" class="form-control" v-model="protobufContent" placeholder="protobuf file content"></textarea></div><div class="col-md-3"><input type="text" class="form-control input-sm" v-model="protobufTypePath" placeholder="protobuf type path"></div><div class="col-md-4"><button class="btn btn-link btn-sm" :disabled="!protobufContent || !protobufTypePath" @click="loadProtobuf()">load</button></div></div><div class="row" v-else><div class="col-md-6"><div class="col-md-12" v-if="protocol !== 'HTTP' || shouldContainBody"><template v-if="!isPreview"><textarea style="width:100%;height:150px" class="form-control" v-model="message" v-if="shouldShowMessageTextarea"></textarea><div v-for="(formData, index) in formDatas" class="row" v-else><div class="col-md-3"><input type="text" class="form-control input-sm" :value="formData.key" @keyup="setKeyOfFormData(index, $event)" placeholder="form data name"></div><div class="col-md-5"><input type="text" class="form-control input-sm" v-if="formData.type === 'text'" :value="formData.value" @keyup="setValueOfFormData(index, $event)" placeholder="form data value"> <input type="file" class="form-control input-sm" v-else @change="setValueOfFormData(index, $event)" placeholder="form data value"></div><div class="col-md-2"><select class="form-control" :value="formData.type" @change="setTypeOfFormData(index, $event)"><option value="text">text</option><option value="file">file</option></select></div><div class="col-md-2"><button class="btn btn-link btn-sm" @click="deleteFormData(index)">delete</button></div></div></template><pre v-else>{{previewResult}}</pre></div></div><div class="col-md-6" v-if="protocol === 'WebSocket' || protocol === 'HTTP'"><div v-for="(parameter, index) in parameters" class="row"><div class="col-md-3"><input type="text" class="form-control input-sm" :value="parameter.key" @keyup="setKeyOfParameter(index, $event)" placeholder="parameter name"></div><div class="col-md-7"><input type="text" class="form-control input-sm" :value="parameter.value" @keyup="setValueOfParameter(index, $event)" placeholder="parameter value"></div><div class="col-md-2"><button class="btn btn-link btn-sm" @click="deleteParameter(index)">delete</button></div></div><div v-for="(header, index) in headers" v-if="protocol === 'HTTP'" class="row"><div class="col-md-3"><input type="text" class="form-control input-sm" :value="header.key" @keyup="setKeyOfHeader(index, $event)" placeholder="header name"></div><div class="col-md-7"><input type="text" class="form-control input-sm" :value="header.value" @keyup="setValueOfHeader(index, $event)" placeholder="header value"></div><div class="col-md-2"><button class="btn btn-link btn-sm" @click="deleteHeader(index)">delete</button></div></div></div></div><div class="row" v-if="!dnsIsHidden"><div class="col-md-5"><input type="text" class="form-control input-sm" v-model="dnsQuestionName" placeholder="DNS question name"></div><div class="col-md-3"><input type="number" class="form-control input-sm" v-model="dnsTransactionId" placeholder="DNS transaction ID"></div></div><div class="row"><div class="col-md-12"><button class="btn btn-default btn-sm" @click="previewMessage()" :disabled="message===''" v-if="messageType !== 'FormData' && !isPreview">preview message</button><button class="btn btn-default btn-sm" @click="cancelPreview()" :disabled="message===''" v-if="messageType !== 'FormData' && isPreview">cancel preview</button><button class="btn btn-primary btn-sm" @click="sendMessage()" :disabled="isDisconnected">send message</button><button class="btn btn-default btn-sm" @click="clear()" :disabled="messages.length===0">clear</button><button class="btn btn-default btn-sm" @click="savingAsBookmark()">{{isEditing ? "cancel bookmark" : "save as bookmark"}}</button><button class="btn btn-default btn-sm" @click="toggleFilter()">{{filterIsHidden ? "show filter" : "hide filter"}}</button></div></div><div class="row" v-if="isEditing"><div class="col-md-4"><input ref="bookmarkName" type="text" class="form-control input-sm" v-model="bookmarkName" placeholder="bookmark name"></div><div class="col-md-2"><button class="btn btn-link btn-sm" @click="saveAsBookmark()" :disabled="!canSaveAsBookmark">save</button></div></div><div class="row" v-if="!filterIsHidden"><div class="col-md-6"><input ref="filter" type="text" class="form-control input-sm" v-model="filter" placeholder="filter"></div></div><div class="row"><div class="col-md-12"><label><input type="checkbox" v-model="showRaw"> show raw data</label><label><input type="checkbox" v-model="showFormatted"> show formatted data</label></div></div><div class="row"><div class="col-md-12"><ul><li v-for="(message, index) in filteredMessages" class="visibility-button-container"><span class="label label-default">{{message.moment}}</span><span v-if="message.type==='open'" class="label label-success">open</span><span v-if="message.type==='close'" class="label label-danger">close</span><span v-if="message.type==='error'" class="label label-danger">error</span><span v-if="message.type==='out'" class="label label-info">out</span><span v-if="message.type==='in'" class="label label-info">in</span><span v-if="message.isBinary === true" class="label label-warning">binary</span><span v-if="message.isBinary === false" class="label label-warning">string</span><span v-if="message.type==='tips'" class="label label-info">tips</span><button v-if="message.formattedData || message.rawData || message.tips" class="btn btn-xs btn-default clipboard" :data-clipboard-target="'#' + resultId(message.id)">copy</button><span v-if="message.reason">{{message.reason}}</span><span v-if="message.data">{{message.data}}</span><template v-if="message.formattedData"><pre :id="resultId(message.id)" v-if="message.visible !== undefined ? message.visible : showFormatted">{{message.formattedData}}</pre><label v-else class="label label-default">formatted</label><button class="btn btn-xs btn-default" @click="toggleMessageVisibility(message)" :style="visibilityButtonStyle(message)">{{messageVisibility(message) ? "hide" : "show"}}</button></template><template v-if="message.rawData"><pre :id="resultId(message.id)" v-if="message.visible !== undefined ? message.visible : showRaw">{{message.rawData}}</pre><label v-else class="label label-default">raw</label><button class="btn btn-xs btn-default" @click="toggleMessageVisibility(message)" :style="visibilityButtonStyle(message)">{{messageVisibility(message) ? "hide" : "show"}}</button></template><pre v-if="message.tips" :id="resultId(message.id)">{{message.tips}}</pre></li></ul></div></div></div></div></div>`;
