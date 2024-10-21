import { GAME_STATE } from './gameState.js';
import { GAME_CONSTANTS } from './constants.js';
import { WebSocketHandler } from './webSocketHandler.js';
import { PelletManager } from './pelletManager.js';
import { HazardManager } from './hazardManager.js';
import { BlobManager } from './blobManager.js';

export const GameSetup = {
    config: {
        type: Phaser.AUTO,
        width: window.innerWidth * 0.75, // Adjust the width to 75% of the window
        height: window.innerHeight,
        backgroundColor: '#2C2F33',
        parent: 'game-container',
        scene: {
            preload: function() {},
            create: function() {
                GAME_STATE.gameScene = this;
                PelletManager.spawnPellets();
                HazardManager.spawnHazardousPellets(GAME_CONSTANTS.HAZARDOUS_PELLET_COUNT);
            },
            update: function() {
                BlobManager.applyFriction();
                BlobManager.checkBlobCollisions();
                PelletManager.checkPelletCollisions();
                HazardManager.checkHazardousPelletCollisions();
                BlobManager.keepBlobsInBounds();
            }
        },
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        }
    },
    init: function() {
        this.game = new Phaser.Game(this.config);
        WebSocketHandler.init();

        // Add event listener for window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    },
    handleResize: function() {
        const newWidth = window.innerWidth * 0.75;
        const newHeight = window.innerHeight;
        this.game.scale.resize(newWidth, newHeight);
    }
};