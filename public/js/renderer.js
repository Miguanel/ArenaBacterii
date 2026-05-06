// renderer.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mCanvas = document.getElementById('minimapCanvas');
const mCtx = mCanvas.getContext('2d');

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

// Funkcje pomocnicze
function getConvexHull(points) {
    if (points.length < 3) return points;
    points.sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower = [];
    for (let i = 0; i < points.length; i++) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) lower.pop();
        lower.push(points[i]);
    }
    const upper = [];
    for (let i = points.length - 1; i >= 0; i--) {
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) upper.pop();
        upper.push(points[i]);
    }
    upper.pop(); lower.pop();
    return lower.concat(upper);
}

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;

function getRelPos(objX, objY, camX, camY) {
    let dx = objX - camX;
    let dy = objY - camY;
    if (dx < -WORLD_WIDTH / 2) dx += WORLD_WIDTH;
    if (dx > WORLD_WIDTH / 2) dx -= WORLD_WIDTH;
    if (dy < -WORLD_HEIGHT / 2) dy += WORLD_HEIGHT;
    if (dy > WORLD_HEIGHT / 2) dy -= WORLD_HEIGHT;
    return { x: canvas.width/2 + dx, y: canvas.height/2 + dy };
}

const MAX_HP_MAP = { base: 100, thruster: 80, storage: 120, shooter: 100, armor: 300, harvester: 100, generator: 80, chloroplast: 80, filter: 100, spike: 150, flesh: 50, sensor: 80 };

function draw() {
    if(!window.isGameRunning) return;

    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let myOrg = window.gameState[window.myOwnerId];
    if (myOrg && !window.isSpectator) {
        window.cameraX += (myOrg.x - window.cameraX) * 0.1;
        window.cameraY += (myOrg.y - window.cameraY) * 0.1;
    }

    // Tło Siatki
    let gridSize = 200;
    let offX = (window.cameraX % gridSize);
    let offY = (window.cameraY % gridSize);
    if(offX < 0) offX += gridSize;
    if(offY < 0) offY += gridSize;

    ctx.strokeStyle = "#16ff0011"; ctx.lineWidth = 1;
    for (let x = -gridSize; x < canvas.width + gridSize; x += gridSize) {
        let drawX = x - offX + (canvas.width/2 % gridSize);
        ctx.beginPath(); ctx.moveTo(drawX, 0); ctx.lineTo(drawX, canvas.height); ctx.stroke();
    }
    for (let y = -gridSize; y < canvas.height + gridSize; y += gridSize) {
        let drawY = y - offY + (canvas.height/2 % gridSize);
        ctx.beginPath(); ctx.moveTo(0, drawY); ctx.lineTo(canvas.width, drawY); ctx.stroke();
    }

    // Rysowanie zjawisk pogodowych
    [...(window.mapZonesState.dense || []), ...(window.mapZonesState.toxic || []), ...(window.mapZonesState.sunbeams || [])].forEach(z => {
        let pos = getRelPos(z.x, z.y, window.cameraX, window.cameraY);
        if (pos.x > -500 && pos.x < canvas.width+500 && pos.y > -500 && pos.y < canvas.height+500) {
            if (window.mapZonesState.toxic && window.mapZonesState.toxic.includes(z)) {
                let grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, z.r);
                grad.addColorStop(0, "rgba(0, 255, 50, 0.3)"); grad.addColorStop(1, "rgba(0, 255, 50, 0)");
                ctx.fillStyle = grad;
            } else if (window.mapZonesState.sunbeams && window.mapZonesState.sunbeams.includes(z)) {
                let grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, z.r);
                grad.addColorStop(0, "rgba(255, 255, 100, 0.4)"); grad.addColorStop(1, "rgba(255, 255, 100, 0)");
                ctx.fillStyle = grad;
            } else {
                ctx.fillStyle = "rgba(0, 50, 150, 0.15)";
            }
            ctx.beginPath(); ctx.arc(pos.x, pos.y, z.r, 0, Math.PI*2); ctx.fill();
        }
    });

    if (window.bunkerState) {
        let pos = getRelPos(window.bunkerState.x, window.bunkerState.y, window.cameraX, window.cameraY);
        if (pos.x > -200 && pos.x < canvas.width+200 && pos.y > -200 && pos.y < canvas.height+200) {
            ctx.fillStyle = "rgba(255, 255, 0, 0.1)";
            ctx.beginPath(); ctx.arc(pos.x, pos.y, window.bunkerState.radius, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = "yellow"; ctx.lineWidth = 2; ctx.stroke();
        }
    }

    ctx.fillStyle = "#00d4ff";
    window.foodState.forEach(f => {
        let pos = getRelPos(f.x, f.y, window.cameraX, window.cameraY);
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 3, 0, Math.PI*2); ctx.fill();
    });

    ctx.fillStyle = "#ff00ff";
    window.mineralState.forEach(m => {
        let pos = getRelPos(m.x, m.y, window.cameraX, window.cameraY);
        ctx.fillRect(pos.x - 3, pos.y - 3, 6, 6);
    });

    ctx.fillStyle = "#ff00ff";
    window.virusState.forEach(v => {
        let pos = getRelPos(v.x, v.y, window.cameraX, window.cameraY);
        ctx.beginPath(); ctx.moveTo(pos.x, pos.y - 8); ctx.lineTo(pos.x + 6, pos.y);
        ctx.lineTo(pos.x, pos.y + 8); ctx.lineTo(pos.x - 6, pos.y); ctx.fill();
    });

    ctx.fillStyle = "#00ffff";
    window.playerPhageState.forEach(f => {
        let pos = getRelPos(f.x, f.y, window.cameraX, window.cameraY);
        ctx.beginPath(); ctx.moveTo(pos.x, pos.y - 5); ctx.lineTo(pos.x + 15, pos.y);
        ctx.lineTo(pos.x, pos.y + 5); ctx.lineTo(pos.x - 5, pos.y); ctx.fill();
    });

    ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.strokeStyle = "white";
    window.predatorState.forEach(m => {
        let pos = getRelPos(m.x, m.y, window.cameraX, window.cameraY);
        ctx.beginPath(); ctx.arc(pos.x, pos.y, m.radius, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    });

    // NAPRAWA BŁĘDU RYSOWANIA ORGANIZMÓW
    for (let id in window.gameState) {
        let org = window.gameState[id];
        if (!org.nodes || org.nodes.length === 0) continue;

        let anchor = org.nodes[0];
        let anchorScreen = getRelPos(anchor.x, anchor.y, window.cameraX, window.cameraY);

        if (anchorScreen.x < -500 || anchorScreen.x > canvas.width+500 || anchorScreen.y < -500 || anchorScreen.y > canvas.height+500) continue;

        let screenNodes = org.nodes.map(n => {
            let dx = n.x - anchor.x;
            let dy = n.y - anchor.y;
            if (dx < -WORLD_WIDTH / 2) dx += WORLD_WIDTH;
            if (dx > WORLD_WIDTH / 2) dx -= WORLD_WIDTH;
            if (dy < -WORLD_HEIGHT / 2) dy += WORLD_HEIGHT;
            if (dy > WORLD_HEIGHT / 2) dy -= WORLD_HEIGHT;
            return { ...n, sx: anchorScreen.x + dx, sy: anchorScreen.y + dy };
        });

        if (screenNodes.length >= 3) {
            let hullNodes = screenNodes.map(n => ({x: n.sx, y: n.sy}));
            let hull = getConvexHull(hullNodes);
            ctx.beginPath(); ctx.moveTo(hull[0].x, hull[0].y);
            for (let i = 1; i < hull.length; i++) ctx.lineTo(hull[i].x, hull[i].y);
            ctx.closePath();
            ctx.lineJoin = 'round'; ctx.lineWidth = 35;
            ctx.fillStyle = id === window.myOwnerId ? "rgba(22, 255, 0, 0.15)" : (org.isNPC ? "rgba(200, 0, 255, 0.15)" : "rgba(255, 0, 0, 0.15)");
            ctx.strokeStyle = id === window.myOwnerId ? "rgba(22, 255, 0, 0.3)" : (org.isNPC ? "rgba(200, 0, 255, 0.3)" : "rgba(255, 0, 0, 0.3)");
            ctx.stroke(); ctx.fill();
        }

        screenNodes.forEach((n) => {
            if (n.type === 'shooter') ctx.fillStyle = '#00ffff';
            else if (n.type === 'thruster') ctx.fillStyle = 'orange';
            else if (n.type === 'storage') ctx.fillStyle = '#ffcc00';
            else if (n.type === 'armor') ctx.fillStyle = '#888888';
            else if (n.type === 'harvester') ctx.fillStyle = '#ff00aa';
            else if (n.type === 'generator') ctx.fillStyle = '#aaff00';
            else if (n.type === 'chloroplast') ctx.fillStyle = '#228B22';
            else if (n.type === 'filter') ctx.fillStyle = '#FFFFFF';
            else if (n.type === 'spike') ctx.fillStyle = '#444444';
            else if (n.type === 'flesh') ctx.fillStyle = '#ff6666';
            else if (n.type === 'sensor') ctx.fillStyle = '#66ccff';
            else ctx.fillStyle = '#16ff00';

            ctx.beginPath(); ctx.arc(n.sx, n.sy, 14, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = id === window.myOwnerId ? "white" : (org.isNPC ? "#ff00ff" : "red");
            ctx.lineWidth = id === window.myOwnerId ? 2 : 1; ctx.stroke();

            if (n.type === 'harvester') {
                ctx.strokeStyle = "rgba(255, 0, 170, 0.1)";
                ctx.beginPath(); ctx.arc(n.sx, n.sy, 70, 0, Math.PI*2); ctx.stroke();
            }

            let maxHpForType = MAX_HP_MAP[n.type] || 100;
            let hpPercent = n.hp / maxHpForType;
            if (hpPercent < 1.0 && hpPercent > 0) {
                ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(n.sx, n.sy, 16, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * hpPercent)); ctx.stroke();
            }

            ctx.font = "14px Arial"; ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            let emoji = "";
            if (n.type === 'shooter') emoji = '🎯';
            else if (n.type === 'thruster') emoji = '🔥';
            else if (n.type === 'storage') emoji = '🛢️';
            else if (n.type === 'armor') emoji = '🛡️';
            else if (n.type === 'harvester') emoji = '🧲';
            else if (n.type === 'generator') emoji = '🔋';
            else if (n.type === 'chloroplast') emoji = '🌱';
            else if (n.type === 'filter') emoji = '🧼';
            else if (n.type === 'spike') emoji = '🗡️';
            else if (n.type === 'flesh') emoji = '🥩';
            else if (n.type === 'sensor') emoji = '📡';
            else emoji = '🦠';
            ctx.fillText(emoji, n.sx, n.sy);

            if (n.minerals > 0.5) {
                ctx.fillStyle = "rgba(255, 0, 255, 0.75)";
                ctx.beginPath(); ctx.arc(n.sx, n.sy, Math.min(n.minerals * 1.5, 8), 0, Math.PI*2); ctx.fill();
            }
        });

        if (id === window.myOwnerId && !window.isSpectator) {
            let pos = getRelPos(org.x, org.y, window.cameraX, window.cameraY);
            ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(pos.x - 20, pos.y - 30, 40, 6);
            ctx.fillStyle = org.atp >= 200 ? "#ffaa00" : "#ffffff";
            ctx.fillRect(pos.x - 20, pos.y - 30, Math.min((org.atp / 200) * 40, 40), 6);
        }
    }

    // MINIMAPA
    mCtx.fillStyle = "black"; mCtx.fillRect(0, 0, 150, 150);
    const scale = 150 / WORLD_WIDTH;

    if (window.mapZonesState.toxic) {
        window.mapZonesState.toxic.forEach(z => { mCtx.fillStyle = "rgba(0, 255, 50, 0.3)"; mCtx.beginPath(); mCtx.arc(z.x * scale, z.y * scale, z.r * scale, 0, Math.PI*2); mCtx.fill(); });
    }
    if (window.mapZonesState.sunbeams) {
        window.mapZonesState.sunbeams.forEach(z => { mCtx.fillStyle = "rgba(255, 255, 100, 0.4)"; mCtx.beginPath(); mCtx.arc(z.x * scale, z.y * scale, z.r * scale, 0, Math.PI*2); mCtx.fill(); });
    }

    if (window.bunkerState) {
        mCtx.fillStyle = "rgba(255, 255, 0, 0.4)"; mCtx.beginPath(); mCtx.arc(window.bunkerState.x * scale, window.bunkerState.y * scale, window.bunkerState.radius * scale, 0, Math.PI*2); mCtx.fill();
        mCtx.strokeStyle = "yellow"; mCtx.lineWidth = 1; mCtx.stroke();
    }

    for (let id in window.gameState) {
        let org = window.gameState[id];
        mCtx.fillStyle = (id === window.myOwnerId) ? "#16ff00" : (org.isNPC ? "purple" : "red");
        mCtx.fillRect(org.x * scale, org.y * scale, 3, 3);
    }

    mCtx.strokeStyle = "white"; mCtx.lineWidth = 1;
    let mmCamX = window.cameraX * scale;
    let mmCamY = window.cameraY * scale;
    mCtx.strokeRect(mmCamX - (canvas.width*scale)/2, mmCamY - (canvas.height*scale)/2, canvas.width * scale, canvas.height * scale);

    requestAnimationFrame(draw);
}