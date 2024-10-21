import { FactionManager } from './factionManager.js';
import { BlobManager } from './blobManager.js';

export const ChatHandler = {
    processMessage: function(chatData) {
        const message = chatData.message.trim().toLowerCase();
        if (message.startsWith('!join')) {
            const factionName = message.split(' ')[1];
            if (factionName) {
                FactionManager.joinFaction(factionName, chatData.username);
            }
        } else if (['!up', '!down', '!left', '!right'].includes(message)) {
            BlobManager.moveBlob(chatData.username, message.substring(1));
        }
        this.updateChatDisplay(chatData);
    },
    updateChatDisplay: function(chatData) {
        const chatDiv = document.getElementById('chat');
        const messageElement = document.createElement('p');
        messageElement.textContent = `${chatData.username}: ${chatData.message}`;
        chatDiv.appendChild(messageElement);
        chatDiv.scrollTop = chatDiv.scrollHeight;
    }
};