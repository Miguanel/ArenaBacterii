const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mCanvas = document.getElementById('minimapCanvas');
const mCtx = mCanvas.getContext('2d');

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

// Eksponujemy te zmienne dla client.js
window.cameraX = 0;
window.cameraY = 0;

function draw() {
    if(!window.isGameRunning) return;

    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let myCell = window.gameState[window.myOwnerId];
    if (myCell) {
        let targetCamX = myCell.x - canvas.width / 2;
        let targetCamY = myCell.y - canvas.height / 2;
        window.cameraX += (targetCamX - window.cameraX) * 0.1;
        window.cameraY += (targetCamY - window.cameraY) * 0.1;
    }

    ctx.save();
    ctx.translate(-window.cameraX, -window.cameraY);

    // Tło Siatki
    ctx.strokeStyle = "#16ff0011"; ctx.lineWidth = 1;
    for(let i = 0; i <= 3000; i += 200) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 3000); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(3000, i); ctx.stroke();
    }

    if (window.bunkerState) {
        ctx.fillStyle = "rgba(255, 255, 0, 0.1)";
        ctx.beginPath(); ctx.arc(window.bunkerState.x, window.bunkerState.y, window.bunkerState.radius, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "yellow"; ctx.lineWidth = 2; ctx.stroke();
    }

    ctx.fillStyle = "#00d4ff";
    window.foodState.forEach(f => { ctx.beginPath(); ctx.arc(f.x, f.y, 3, 0, Math.PI*2); ctx.fill(); });

    ctx.fillStyle = "#ff00ff";
    window.virusState.forEach(v => {
        ctx.beginPath(); ctx.moveTo(v.x, v.y - 8); ctx.lineTo(v.x + 6, v.y);
        ctx.lineTo(v.x, v.y + 8); ctx.lineTo(v.x - 6, v.y); ctx.fill();
    });

    ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.strokeStyle = "white";
    window.predatorState.forEach(m => {
        ctx.beginPath(); ctx.arc(m.x, m.y, m.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    });

    for (let id in window.gameState) {
        let b = window.gameState[id];
        ctx.globalAlpha = b.isHidden ? 0.3 : 1.0;
        ctx.fillStyle = b.color || "#16ff00";
        ctx.beginPath(); ctx.arc(b.x, b.y, 15, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = (id === window.myOwnerId) ? "white" : "red";
        ctx.lineWidth = (id === window.myOwnerId) ? 3 : 1; ctx.stroke();

        if (id === window.myOwnerId) {
            ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(b.x - 20, b.y - 30, 40, 6);
            ctx.fillStyle = b.atp >= 200 ? "#ffaa00" : "#ffffff";
            ctx.fillRect(b.x - 20, b.y - 30, Math.min((b.atp / 200) * 40, 40), 6);
        }
        ctx.globalAlpha = 1.0;
    }
    ctx.restore();

    // MINIMAPA
    mCtx.fillStyle = "black"; mCtx.fillRect(0, 0, 150, 150);
    const scale = 150 / 3000;
    for (let id in window.gameState) {
        let b = window.gameState[id];
        mCtx.fillStyle = (id === window.myOwnerId) ? "#16ff00" : "red";
        mCtx.fillRect(b.x * scale, b.y * scale, 3, 3);
    }
    mCtx.strokeStyle = "white"; mCtx.lineWidth = 1;
    mCtx.strokeRect(window.cameraX * scale, window.cameraY * scale, canvas.width * scale, canvas.height * scale);

    requestAnimationFrame(draw);
}