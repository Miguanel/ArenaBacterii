let socket;

// Globalne zmienne stanu używane przez renderer.js
window.myOwnerId = null;
window.gameState = {};
window.foodState = [];
window.virusState = [];
window.predatorState = [];
window.bunkerState = null;
window.isGameRunning = false;

function joinGame() {
    const name = document.getElementById('strainName').value;
    document.getElementById('loginScreen').style.display = 'none';
    socket = io({ auth: { playerName: name } });

    socket.on('spawn', (data) => {
        window.myOwnerId = data.ownerId;
        document.getElementById('idDisplay').innerText = data.species;
        window.isGameRunning = true;
        requestAnimationFrame(draw); // Odpal renderer.js
    });

    socket.on('enterMutationZone', () => document.getElementById('mutationMenu').style.display = 'block');

    socket.on('updateMap', (data) => {
        if(!data) return;
        window.gameState = data.cells || {};
        window.foodState = data.food || [];
        window.virusState = data.viruses || [];
        window.predatorState = data.predators || [];
        window.bunkerState = data.plutoniumZone || null;

        let myCell = window.gameState[window.myOwnerId];
        if(myCell) document.getElementById('atpDisplay').innerText = Math.floor(myCell.atp);

        if(data.leaderboard) {
            let lbHTML = "";
            data.leaderboard.forEach(e => lbHTML += `<div>${e[0]}: ${e[1]}</div>`);
            document.getElementById('lbList').innerHTML = lbHTML;
        }
    });
}

function closeMutationMenu() {
    document.getElementById('mutationMenu').style.display = 'none';
    socket.emit('exitZone');
}

window.addEventListener('mousemove', (e) => {
    if (socket && window.isGameRunning) {
        socket.emit('chemotaxis', {
            targetX: e.clientX + window.cameraX,
            targetY: e.clientY + window.cameraY
        });
    }
});