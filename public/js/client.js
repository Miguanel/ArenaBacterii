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
        window.gameState = data.organisms || {};
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
    // Definicja funkcji dostępnej z konsoli (F12)
    window.ranking = function() {
        console.log("📊 Pobieranie rankingu z bazy danych...");
        if (socket) {
            socket.emit('getRanking');
        } else {
            console.error("❌ Brak połączenia z serwerem.");
        }
    };

    // Słuchacz odpowiedzi z serwera
    socket.on('rankingList', (data) => {
        console.clear();
        console.log("%c🏆 TOP 10 EWOLUCJI 🏆", "color: #ffcc00; font-weight: bold; font-size: 16px;");
        console.table(data.map((entry, index) => ({
            Miejsce: index + 1,
            Nazwa: entry.name,
            Wynik: entry.score + " ATP",
            Data: new Date(entry.date).toLocaleString()
        })));
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