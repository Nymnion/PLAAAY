import { GAME_STATE } from './gameState.js';
import { GAME_CONSTANTS } from './constants.js';
import { BlobManager } from './blobManager.js';

export const PelletManager = {
    spawnPellets: function() {
        for (let i = 0; i < GAME_CONSTANTS.PELLET_COUNT; i++) {
            this.spawnPellet();
        }
    },
    spawnPellet: function() {
        let x = Phaser.Math.Between(10, GAME_STATE.gameScene.scale.width - 10);
        let y = Phaser.Math.Between(10, GAME_STATE.gameScene.scale.height - 10);
        let pellet = GAME_STATE.gameScene.add.circle(x, y, 5, 0xFF69B4);
        GAME_STATE.pellets.push(pellet);
    },
    checkPelletCollisions: function() {
        for (let key in GAME_STATE.factions) {
            let faction = GAME_STATE.factions[key];
            let blob = faction.blob;

            for (let i = GAME_STATE.pellets.length - 1; i >= 0; i--) {
                let pellet = GAME_STATE.pellets[i];
                let distance = Phaser.Math.Distance.Between(blob.x, blob.y, pellet.x, pellet.y);

                if (distance < blob.radius + 5) {
                    pellet.destroy();
                    GAME_STATE.pellets.splice(i, 1);
                    BlobManager.growFactionBlob(faction, GAME_CONSTANTS.PELLET_GROWTH_AMOUNT);
                    console.log(`${key} faction consumed a pellet!`);

                    this.scheduleNextPelletSpawn();
                }
            }
        }
    },
    scheduleNextPelletSpawn: function() {
        setTimeout(() => {
            if (Math.random() < GAME_CONSTANTS.PELLET_RESPAWN_CHANCE) {
                this.spawnPellet();
            } else {
                this.scheduleNextPelletSpawn();
            }
        }, GAME_CONSTANTS.PELLET_RESPAWN_TIME);
    }
};