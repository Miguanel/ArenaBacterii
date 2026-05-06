let socket;

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
        requestAnimationFrame(draw);
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
        if(myCell) {
            const atpDisplay = document.getElementById('atpDisplay');
            if (atpDisplay) atpDisplay.innerText = Math.floor(myCell.atp);
        }

        // NAPRAWA BŁĘDU: Bezpieczne ładowanie tabeli
        if(data.leaderboard) {
            const lbList = document.getElementById('lbList');
            if (lbList) {
                let lbHTML = "";
                // Skrócony ranking na ekranie gry (TOP 3)
                data.leaderboard.slice(0, 3).forEach(e => lbHTML += `<div>${e[0]}: ${e[1]}</div>`);
                lbList.innerHTML = lbHTML;
            }

            // Wysyłamy dane do modala "Gracze", jeśli funkcja istnieje (jest w index.html)
            if (typeof updatePlayersModal === 'function') {
                updatePlayersModal(data.leaderboard);
            }
        }
    });

    window.ranking = function() {
        console.log("📊 Pobieranie rankingu z bazy danych...");
        if (socket) socket.emit('getRanking');
        else console.error("❌ Brak połączenia z serwerem.");
    };

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