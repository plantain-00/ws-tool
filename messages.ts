export const stompConnectionMessage = `CONNECT
login:admin
passcode:admin
accept-version:1.2,1.1,1.0
heart-beat:0,0

 `;
export const stompSubscriptionMessage = `SUBSCRIBE
id:sub-0
destination:/topic/test_topic

 `;
export const stompSendMessage = `SEND
destination:/queue/test
content-type:text/plain

hello queue test
 `;
