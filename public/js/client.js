// client.js
window.socket = null; // ZMIANA: socket jest teraz globalny

// Globalne zmienne stanu używane przez inne pliki
window.myOwnerId = null;
window.gameState = {};
window.foodState = [];
window.mineralState = [];
window.mapZonesState = { sunbeams: [], toxic: [], dense: [] };
window.virusState = [];
window.predatorState = [];
window.playerPhageState = [];
window.bunkerState = null;
window.isGameRunning = false;
window.isSpectator = false;
window.cameraX = 1500;
window.cameraY = 1500;

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;

function joinGame() {
    const name = document.getElementById('strainName').value;
    document.getElementById('loginScreen').style.display = 'none';
    window.socket = io({ auth: { playerName: name } });

    window.socket.on('spawn', (data) => {
        window.myOwnerId = data.ownerId;
        document.getElementById('idDisplay').innerText = data.species;
        window.cameraX = 1500; window.cameraY = 800; // Start w bunkrze
        window.isSpectator = false;
        document.getElementById('spectatorUI').style.display = 'none';
        document.getElementById('gameCanvas').classList.remove('spectator-cursor');
        window.isGameRunning = true;
        requestAnimationFrame(draw);
    });

    window.socket.on('gameOver', () => {
        window.isSpectator = true;
        document.getElementById('spectatorUI').style.display = 'block';
        document.getElementById('atpDisplay').innerText = "MARTWY";
        document.getElementById('gameCanvas').classList.add('spectator-cursor');
    });

    window.socket.on('enterMutationZone', () => {
        document.getElementById('mutationMenu').style.display = 'block';
        if (typeof loadEditor === 'function') loadEditor();
    });

    window.socket.on('blueprintSaved', () => {
        document.getElementById('mutationMenu').style.display = 'none';
        window.socket.emit('exitZone');
    });

    window.socket.on('errorMsg', (msg) => alert(msg));

    window.socket.on('updateMap', (data) => {
        if(!data) return;
        window.gameState = data.organisms || {};
        window.foodState = data.food || [];
        window.mineralState = data.minerals || [];
        window.virusState = data.viruses || [];
        window.predatorState = data.predators || [];
        window.playerPhageState = data.playerPhages || [];
        window.mapZonesState = data.zones || { sunbeams: [], toxic: [], dense: [] };
        window.bunkerState = data.plutoniumZone || null;

        let myCell = window.gameState[window.myOwnerId];
        if(myCell && !window.isSpectator) {
            let currentAtp = Math.floor(myCell.atp);
            document.getElementById('atpDisplay').innerText = `${currentAtp} (Komórki: ${myCell.nodes.length})`;

            const editorAtp = document.getElementById('editorCurrentAtp');
            if(editorAtp) editorAtp.innerText = currentAtp;

            const costSpan = document.getElementById('blueprintCost');
            const costContainer = document.getElementById('costContainer');
            if (costSpan && costContainer) {
                const cost = parseInt(costSpan.innerText) || 0;
                if (currentAtp < cost) {
                    costContainer.style.color = "#ff4444";
                    costContainer.style.borderColor = "#ff4444";
                    costContainer.style.background = "rgba(255, 0, 0, 0.15)";
                } else {
                    costContainer.style.color = "#ffaa00";
                    costContainer.style.borderColor = "#ffaa00";
                    costContainer.style.background = "rgba(255, 170, 0, 0.1)";
                }
            }
        }

        if(data.leaderboard) {
            const lbList = document.getElementById('lbList');
            if (lbList) {
                let lbHTML = "";
                data.leaderboard.slice(0, 3).forEach(e => lbHTML += `<div>${e[0]}: ${e[1]}</div>`);
                lbList.innerHTML = lbHTML;
            }
            if (typeof updatePlayersModal === 'function') {
                updatePlayersModal(data.leaderboard);
            }
        }
    });

    window.ranking = function() {
        if (window.socket) window.socket.emit('getRanking');
    };

    window.socket.on('rankingList', (data) => {
        console.clear();
        console.log("%c🏆 TOP 10 EWOLUCJI 🏆", "color: #ffcc00; font-weight: bold; font-size: 16px;");
        console.table(data.map((entry, index) => ({
            Miejsce: index + 1, Nazwa: entry.name, Wynik: entry.score + " ATP", Data: new Date(entry.date).toLocaleString()
        })));
    });
}

function closeMutationMenu() {
    document.getElementById('mutationMenu').style.display = 'none';
    if(window.socket) window.socket.emit('exitZone');
}

let isDragging = false;
let lastMouseX = 0, lastMouseY = 0;

window.addEventListener('mousedown', (e) => {
    if (window.isSpectator) { isDragging = true; lastMouseX = e.clientX; lastMouseY = e.clientY; }
});
window.addEventListener('mouseup', () => isDragging = false);

window.addEventListener('mousemove', (e) => {
    if (window.socket && window.isGameRunning && !window.isSpectator) {
        const canvas = document.getElementById('gameCanvas');
        let rawX = e.clientX + window.cameraX - canvas.width/2;
        let rawY = e.clientY + window.cameraY - canvas.height/2;
        let normX = ((rawX % WORLD_WIDTH) + WORLD_WIDTH) % WORLD_WIDTH;
        let normY = ((rawY % WORLD_HEIGHT) + WORLD_HEIGHT) % WORLD_HEIGHT;
        window.socket.emit('chemotaxis', { targetX: normX, targetY: normY });
    } else if (window.isSpectator && isDragging) {
        let dx = e.clientX - lastMouseX;
        let dy = e.clientY - lastMouseY;
        window.cameraX -= dx; window.cameraY -= dy;
        lastMouseX = e.clientX; lastMouseY = e.clientY;
    }
});