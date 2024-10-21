import { GAME_STATE } from './gameState.js';
import { GAME_CONSTANTS } from './constants.js';
import { FactionManager } from './factionManager.js';

export const BlobManager = {
    recentDirections: {},
    boostTimers: {},
    flameParticles: {},

    growFactionBlob: function(faction, amount) {
        let blob = faction.blob;
        let currentRadius = blob.radius;
        let growthFactor = Math.log(currentRadius + amount) - Math.log(currentRadius);
        let newRadius = Math.min(currentRadius * Math.exp(growthFactor), GAME_CONSTANTS.MAX_BLOB_RADIUS);
        
        GAME_STATE.gameScene.tweens.add({
            targets: blob,
            radius: newRadius,
            scale: newRadius / 50,
            duration: GAME_CONSTANTS.ANIMATION_DURATION,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                blob.setRadius(blob.radius); // Update the physics body
                this.updateFactionText(faction);
            },
            onComplete: () => {
                FactionManager.updateFactionStats();
            }
        });
    },

    shrinkFactionBlob: function(faction, amount) {
        let blob = faction.blob;
        let currentRadius = blob.radius;
        let newRadius = Math.max(currentRadius - amount, 10); // Minimum radius of 10
        
        GAME_STATE.gameScene.tweens.add({
            targets: blob,
            radius: newRadius,
            scale: newRadius / 50,
            duration: GAME_CONSTANTS.ANIMATION_DURATION,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                blob.setRadius(blob.radius); // Update the physics body
                this.updateFactionText(faction);
            },
            onComplete: () => {
                FactionManager.updateFactionStats();
            }
        });
    },

    moveBlob: function(username, direction) {
        for (let key in GAME_STATE.factions) {
            let faction = GAME_STATE.factions[key];
            if (faction.members.includes(username)) {
                this.addDirection(key, direction);
                let moveSpeed = this.calculateMoveSpeed(faction.blob.radius);
                
                if (this.checkConsensus(key)) {
                    moveSpeed *= GAME_CONSTANTS.SPEED_BOOST_FACTOR;
                    this.applySpeedBoost(faction, direction);
                }

                switch (direction) {
                    case 'up':
                        faction.velocityY -= moveSpeed;
                        break;
                    case 'down':
                        faction.velocityY += moveSpeed;
                        break;
                    case 'left':
                        faction.velocityX -= moveSpeed;
                        break;
                    case 'right':
                        faction.velocityX += moveSpeed;
                        break;
                }
                console.log(`${username} moved the ${key} blob ${direction}!`);
                break;
            }
        }
    },

    calculateMoveSpeed: function(radius) {
        return GAME_CONSTANTS.BASE_MOVE_SPEED * (1 - (radius / GAME_CONSTANTS.MAX_BLOB_RADIUS) * 0.8);
    },

    applyFriction: function() {
        for (let key in GAME_STATE.factions) {
            let faction = GAME_STATE.factions[key];
            faction.velocityX *= GAME_CONSTANTS.FRICTION;
            faction.velocityY *= GAME_CONSTANTS.FRICTION;
            faction.blob.x += faction.velocityX;
            faction.blob.y += faction.velocityY;
            this.updateFactionText(faction);
            this.updateFlameEffect(faction);
        }
    },

    keepBlobsInBounds: function() {
        for (let key in GAME_STATE.factions) {
            let faction = GAME_STATE.factions[key];
            let blob = faction.blob;
            let radius = blob.radius;

            if (blob.x < radius) {
                blob.x = radius;
                faction.velocityX = Math.abs(faction.velocityX);
            } else if (blob.x > GAME_STATE.gameScene.scale.width - radius) {
                blob.x = GAME_STATE.gameScene.scale.width - radius;
                faction.velocityX = -Math.abs(faction.velocityX);
            }

            if (blob.y < radius) {
                blob.y = radius;
                faction.velocityY = Math.abs(faction.velocityY);
            } else if (blob.y > GAME_STATE.gameScene.scale.height - radius) {
                blob.y = GAME_STATE.gameScene.scale.height - radius;
                faction.velocityY = -Math.abs(faction.velocityY);
            }

            this.updateFactionText(faction);
        }
    },

    checkBlobCollisions: function() {
        const factionNames = Object.keys(GAME_STATE.factions);
        const factionsToDestroy = new Set();

        for (let i = 0; i < factionNames.length; i++) {
            const faction1 = GAME_STATE.factions[factionNames[i]];
            
            if (!faction1 || !faction1.blob) continue;

            for (let j = i + 1; j < factionNames.length; j++) {
                const faction2 = GAME_STATE.factions[factionNames[j]];
                
                if (!faction2 || !faction2.blob) continue;
                
                const distance = Phaser.Math.Distance.Between(
                    faction1.blob.x, faction1.blob.y,
                    faction2.blob.x, faction2.blob.y
                );
                
                if (distance < faction1.blob.radius + faction2.blob.radius) {
                    if (faction1.blob.radius > faction2.blob.radius) {
                        factionsToDestroy.add(factionNames[j]);
                        this.growFactionBlob(faction1, faction2.blob.radius * GAME_CONSTANTS.COLLISION_GROWTH_FACTOR);
                    } else if (faction2.blob.radius > faction1.blob.radius) {
                        factionsToDestroy.add(factionNames[i]);
                        this.growFactionBlob(faction2, faction1.blob.radius * GAME_CONSTANTS.COLLISION_GROWTH_FACTOR);
                    }
                }
            }
        }

        factionsToDestroy.forEach(factionName => {
            FactionManager.destroyFaction(factionName);
        });
    },

    updateFactionText: function(faction) {
        let blob = faction.blob;
        
        // Update faction name text
        if (faction.nameText && faction.name) {
            faction.nameText.setPosition(blob.x, blob.y - blob.radius - 10);
            faction.nameText.setText(faction.name.toUpperCase());
            faction.nameText.setStyle({
                font: 'bold 16px Arial',
                fill: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            });
            faction.nameText.setScale(blob.scale);
        }

        // Update officers text
        if (faction.officersText && faction.officers) {
            faction.officersText.setPosition(blob.x, blob.y);
            faction.officersText.setText(faction.officers.join('\n'));
            faction.officersText.setStyle({
                font: '12px Arial',
                fill: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 2
            });
            faction.officersText.setScale(blob.scale * 0.75);
            
            // Center the officers text
            faction.officersText.setOrigin(0.5, 0.5);
        }
    },

    addDirection: function(factionName, direction) {
        if (!this.recentDirections[factionName]) {
            this.recentDirections[factionName] = [];
        }
        this.recentDirections[factionName].push(direction);
        if (this.recentDirections[factionName].length > GAME_CONSTANTS.CONSENSUS_DIRECTIONS_REQUIRED) {
            this.recentDirections[factionName].shift();
        }
    },

    checkConsensus: function(factionName) {
        if (this.recentDirections[factionName] && 
            this.recentDirections[factionName].length === GAME_CONSTANTS.CONSENSUS_DIRECTIONS_REQUIRED) {
            return this.recentDirections[factionName].every(dir => dir === this.recentDirections[factionName][0]);
        }
        return false;
    },

    applySpeedBoost: function(faction, direction) {
        if (this.boostTimers[faction.name]) {
            clearTimeout(this.boostTimers[faction.name]);
        }
    
        this.boostTimers[faction.name] = setTimeout(() => {
            this.recentDirections[faction.name] = [];
            this.stopFlameEffect(faction);
        }, GAME_CONSTANTS.SPEED_BOOST_DURATION);
    
        // Apply an extra boost in the consensus direction
        let boostSpeed = this.calculateMoveSpeed(faction.blob.radius) * GAME_CONSTANTS.SPEED_BOOST_FACTOR;
        switch (direction) {
            case 'up':
                faction.velocityY -= boostSpeed;
                break;
            case 'down':
                faction.velocityY += boostSpeed;
                break;
            case 'left':
                faction.velocityX -= boostSpeed;
                break;
            case 'right':
                faction.velocityX += boostSpeed;
                break;
        }

        this.startFlameEffect(faction);
    },

    startFlameEffect: function(faction) {
        if (!this.flameParticles[faction.name]) {
            this.flameParticles[faction.name] = GAME_STATE.gameScene.add.particles('flame');
        }

        const emitter = this.flameParticles[faction.name].createEmitter({
            speed: { min: 50, max: 100 },
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 300
        });

        emitter.startFollow(faction.blob);
    },

    stopFlameEffect: function(faction) {
        if (this.flameParticles[faction.name]) {
            this.flameParticles[faction.name].removeEmitter(this.flameParticles[faction.name].emitters.first);
            this.flameParticles[faction.name].destroy();
            delete this.flameParticles[faction.name];
        }
    },

    updateFlameEffect: function(faction) {
        if (this.flameParticles[faction.name] && this.flameParticles[faction.name].emitters.first) {
            const blob = faction.blob;
            const angle = Math.atan2(faction.velocityY, faction.velocityX) + Math.PI;
            
            this.flameParticles[faction.name].emitters.first.setAngle(Phaser.Math.RadToDeg(angle));
        }
    }
};