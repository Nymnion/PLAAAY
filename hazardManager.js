import { GAME_STATE } from './gameState.js';
import { GAME_CONSTANTS } from './constants.js';
import { BlobManager } from './blobManager.js';

export const HazardManager = {
    hazardousPellets: [],

    spawnHazardousPellets: function(count) {
        for (let i = 0; i < count; i++) {
            this.spawnHazardousPellet();
        }
    },

    spawnHazardousPellet: function() {
        let x = Phaser.Math.Between(10, GAME_STATE.gameScene.scale.width - 10);
        let y = Phaser.Math.Between(10, GAME_STATE.gameScene.scale.height - 10);
        let pellet = GAME_STATE.gameScene.add.circle(x, y, 7, 0xFF0000);
        this.hazardousPellets.push(pellet);
    },

    checkHazardousPelletCollisions: function() {
        for (let key in GAME_STATE.factions) {
            let faction = GAME_STATE.factions[key];
            let blob = faction.blob;

            for (let i = this.hazardousPellets.length - 1; i >= 0; i--) {
                let pellet = this.hazardousPellets[i];
                let distance = Phaser.Math.Distance.Between(blob.x, blob.y, pellet.x, pellet.y);

                if (distance < blob.radius + 7) {
                    pellet.destroy();
                    this.hazardousPellets.splice(i, 1);
                    BlobManager.shrinkFactionBlob(faction, GAME_CONSTANTS.HAZARD_SHRINK_AMOUNT);
                    console.log(`${key} faction touched a hazardous pellet!`);

                    setTimeout(this.spawnHazardousPellet.bind(this), GAME_CONSTANTS.HAZARD_RESPAWN_TIME);
                }
            }
        }
    }
};