import { ChatHandler } from './chatHandler.js';

export const WebSocketHandler = {
    socket: null,
    init: function() {
        this.socket = new WebSocket('ws://localhost:8080');
        this.socket.addEventListener('open', this.onOpen);
        this.socket.addEventListener('message', this.onMessage);
    },
    onOpen: function() {
        console.log('Connected to the WebSocket server');
    },
    onMessage: function(event) {
        const chatData = JSON.parse(event.data);
        console.log(`${chatData.username}: ${chatData.message}`);
        ChatHandler.processMessage(chatData);
    }
};