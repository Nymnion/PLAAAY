// server.js
require('dotenv').config();
const tmi = require('tmi.js');
const WebSocket = require('ws');

// Twitch Chat Client Setup
const twitchClient = new tmi.Client({
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.TWITCH_OAUTH_TOKEN,
  },
  channels: [process.env.TWITCH_CHANNEL],
});

twitchClient.connect();

// WebSocket Server Setup
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('A new client connected!');
  
  // Forward Twitch chat messages to the WebSocket client
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return; // Ignore messages from the bot itself
    const chatData = {
      username: tags['display-name'],
      message: message,
    };
    ws.send(JSON.stringify(chatData));
  });
});
