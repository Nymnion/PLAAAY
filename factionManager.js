import { GAME_STATE } from './gameState.js';
import { GAME_CONSTANTS } from './constants.js';
import { GameSetup } from './gameSetup.js';

export const FactionManager = {
    joinFaction: function(factionName, username) {
        factionName = this.sanitizeFactionName(factionName);

        if (GAME_STATE.userFactions[username]) {
            let oldFaction = GAME_STATE.factions[GAME_STATE.userFactions[username]];
            if (oldFaction) {
                oldFaction.members = oldFaction.members.filter(member => member !== username);
            }
        }

        if (!GAME_STATE.factionRequests[factionName]) {
            GAME_STATE.factionRequests[factionName] = new Set();
        }

        GAME_STATE.factionRequests[factionName].add(username);
        console.log(`${username} requested to join the ${factionName} faction.`);

        if (GAME_STATE.factionRequests[factionName].size >= 3 && !GAME_STATE.factions[factionName]) {
            this.createFaction(factionName);
        } else if (GAME_STATE.factions[factionName]) {
            this.addMemberToFaction(factionName, username);
        }

        GAME_STATE.userFactions[username] = factionName;
        this.updateFactionStats();
    },
    createFaction: function(factionName) {
        if (!GAME_STATE.gameScene) {
            console.error("Game scene is not ready yet.");
            return;
        }

        let color = Phaser.Display.Color.RandomRGB();
        let x = Phaser.Math.Between(100, GAME_STATE.gameScene.scale.width - 100);
        let y = Phaser.Math.Between(100, GAME_STATE.gameScene.scale.height - 100);
        let newBlob = GAME_STATE.gameScene.add.circle(x, y, 50, color.color);
        newBlob.setInteractive();
        newBlob.radius = 50;

        let nameText = GAME_STATE.gameScene.add.text(x, y - 10, factionName.toUpperCase(), {
            font: 'bold 16px Arial',
            fill: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        let officersText = GAME_STATE.gameScene.add.text(x, y + 10, '', {
            font: '12px Arial',
            fill: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        GAME_STATE.factions[factionName] = {
            name: factionName,
            color: color.color,
            blob: newBlob,
            members: Array.from(GAME_STATE.factionRequests[factionName]),
            nameText: nameText,
            officersText: officersText,
            velocityX: 0,
            velocityY: 0,
            officers: Array.from(GAME_STATE.factionRequests[factionName]).slice(0, 3)
        };

        this.updateOfficersText(GAME_STATE.factions[factionName]);
        this.updateFactionStats();
        console.log(`Faction ${factionName} has been created!`);
    },
    addMemberToFaction: function(factionName, username) {
        let faction = GAME_STATE.factions[factionName];
        if (!faction.members.includes(username)) {
            faction.members.push(username);
            console.log(`${username} joined the ${factionName} faction!`);
            this.showJoinMessage(faction, username);
        } else {
            console.log(`${username} is already a member of the ${factionName} faction.`);
        }
    },
    showJoinMessage: function(faction, username) {
        const joinMessage = GAME_STATE.gameScene.add.text(
            faction.blob.x,
            faction.blob.y - faction.blob.radius - 20,
            username + " joined!",
            {
                font: '16px Arial',
                fill: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5);

        GAME_STATE.gameScene.tweens.add({
            targets: joinMessage,
            y: joinMessage.y - 30,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: function() {
                joinMessage.destroy();
            }
        });
    },
    destroyFaction: function(factionName) {
        const faction = GAME_STATE.factions[factionName];
        if (faction) {
            if (faction.blob) faction.blob.destroy();
            if (faction.nameText) faction.nameText.destroy();
            if (faction.officersText) faction.officersText.destroy();
            
            faction.members.forEach(username => {
                delete GAME_STATE.userFactions[username];
            });
            
            delete GAME_STATE.factions[factionName];
            console.log(`Faction ${factionName} has been destroyed!`);
            this.updateFactionStats();
        }
    },
    updateFactionStats: function() {
        const factionStatsDiv = document.getElementById('faction-stats');
        let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Faction Name</th>
                    <th>Members</th>
                    <th>Blob Radius</th>
                    <th>Officers</th>
                </tr>
            </thead>
            <tbody>
        `;

        for (let key in GAME_STATE.factions) {
            let faction = GAME_STATE.factions[key];
            tableHTML += `
                <tr>
                    <td>${key}</td>
                    <td>${faction.members.length}</td>
                    <td>${faction.blob.radius.toFixed(2)}</td>
                    <td>${faction.officers.join(', ')}</td>
                </tr>
            `;
        }

        tableHTML += `
            </tbody>
        </table>
        `;

        for (let key in GAME_STATE.factions) {
            let faction = GAME_STATE.factions[key];
            tableHTML += `
            <h3>${key} Members:</h3>
            <ul>
                ${faction.members.map(member => `<li>${member}</li>`).join('')}
            </ul>
            `;
        }

        factionStatsDiv.innerHTML = tableHTML;
    },
    updateOfficersText: function(faction) {
        faction.officersText.setText(faction.officers.join('\n'));
    },
    sanitizeFactionName: function(name) {
        return name.replace(/[^a-z0-9]/gi, '').substr(0, 15);
    }
};