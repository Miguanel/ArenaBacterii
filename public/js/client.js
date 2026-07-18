window.socket = null;

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
window.WORLD_WIDTH = 3000;
window.WORLD_HEIGHT = 3000;

window.switchView = function(viewName) {
    const gameView = document.getElementById('view-game');
    const editorView = document.getElementById('view-editor');

    if (viewName === 'editor') {
        gameView.style.display = 'none';
        editorView.style.display = 'flex'; // używamy flex dla wycentrowania
    } else {
        gameView.style.display = 'block';
        editorView.style.display = 'none';
    }
};

function joinGame() {
    const name = document.getElementById('strainName').value;
    document.getElementById('loginScreen').style.display = 'none';
    window.socket = io({ auth: { playerName: name } });

    window.socket.on('spawn', (data) => {
        window.myOwnerId = data.ownerId;
        document.getElementById('idDisplay').innerText = data.species;
        window.cameraX = 1500; window.cameraY = 800;
        window.isSpectator = false;
        document.getElementById('spectatorUI').style.display = 'none';
        document.getElementById('gameCanvas').classList.remove('spectator-cursor');
        window.isGameRunning = true;

        if (typeof window.draw === 'function') {
            requestAnimationFrame(window.draw);
        } else {
            console.error("❌ Błąd: Funkcja draw() wciąż nie istnieje!");
        }
    });

    window.socket.on('gameOver', () => {
        window.isSpectator = true;
        document.getElementById('spectatorUI').style.display = 'block';
        document.getElementById('atpDisplay').innerText = "MARTWY";
        document.getElementById('gameCanvas').classList.add('spectator-cursor');
    });

    window.socket.on('enterMutationZone', () => {
        window.switchView('editor'); // Odpala nowy widok
        if (typeof loadEditor === 'function') loadEditor();
    });

    window.socket.on('blueprintSaved', () => {
        window.switchView('game'); // Wraca do gry
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

window.closeMutationMenu = function() {
    window.switchView('game'); // Wraca do gry
    if(window.socket) window.socket.emit('exitZone');
};

window.isFreeCamera = false;
let isDragging = false;
let isMinimapDragging = false;
let lastMouseX = 0, lastMouseY = 0;

window.resetCamera = function() {
    window.isFreeCamera = false;
    const btn = document.getElementById('centerCamBtn');
    if (btn) btn.style.display = 'none';
};

function handleMinimapInteraction(clientX, clientY) {
    const mCanvas = document.getElementById('minimapCanvas');
    if (!mCanvas) return;
    const rect = mCanvas.getBoundingClientRect();
    let mx = clientX - rect.left;
    let my = clientY - rect.top;

    mx = Math.max(0, Math.min(150, mx));
    my = Math.max(0, Math.min(150, my));

    window.cameraX = mx * (window.WORLD_WIDTH / 150);
    window.cameraY = my * (window.WORLD_HEIGHT / 150);

    window.isFreeCamera = true;
    const btn = document.getElementById('centerCamBtn');
    if(btn) btn.style.display = 'block';
}

function getInputPos(e) {
    if(e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
}

window.addEventListener('mousedown', (e) => {
    if (e.target.id === 'minimapCanvas') {
        isMinimapDragging = true;
        handleMinimapInteraction(e.clientX, e.clientY);
    } else if (e.target.id === 'gameCanvas' || window.isSpectator) {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    }
});

window.addEventListener('touchstart', (e) => {
    const pos = getInputPos(e);
    if (e.target.id === 'minimapCanvas') {
        isMinimapDragging = true;
        handleMinimapInteraction(pos.x, pos.y);
    } else if (e.target.id === 'gameCanvas' || window.isSpectator) {
        isDragging = true;
        lastMouseX = pos.x;
        lastMouseY = pos.y;
    }
}, {passive: false});

window.addEventListener('mouseup', () => { isDragging = false; isMinimapDragging = false; });
window.addEventListener('touchend', () => { isDragging = false; isMinimapDragging = false; });

function handleMove(clientX, clientY) {
    if (isMinimapDragging) {
        handleMinimapInteraction(clientX, clientY);
    } else if (isDragging) {
        let dx = clientX - lastMouseX;
        let dy = clientY - lastMouseY;
        window.cameraX -= dx;
        window.cameraY -= dy;
        lastMouseX = clientX;
        lastMouseY = clientY;

        if (!window.isSpectator) {
            window.isFreeCamera = true;
            const btn = document.getElementById('centerCamBtn');
            if(btn) btn.style.display = 'block';
        }
    }

    if (window.socket && window.isGameRunning && !window.isSpectator) {
        const canvas = document.getElementById('gameCanvas');
        let rawX = clientX + window.cameraX - canvas.width/2;
        let rawY = clientY + window.cameraY - canvas.height/2;
        let normX = ((rawX % window.WORLD_WIDTH) + window.WORLD_WIDTH) % window.WORLD_WIDTH;
        let normY = ((rawY % window.WORLD_HEIGHT) + window.WORLD_HEIGHT) % window.WORLD_HEIGHT;
        window.socket.emit('chemotaxis', { targetX: normX, targetY: normY });
    }
}

window.addEventListener('mousemove', (e) => { handleMove(e.clientX, e.clientY); });
window.addEventListener('touchmove', (e) => {
    if(isDragging || isMinimapDragging) e.preventDefault();
    const pos = getInputPos(e);
    handleMove(pos.x, pos.y);
}, {passive: false});