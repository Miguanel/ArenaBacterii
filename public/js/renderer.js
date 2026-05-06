window.gameCanvas = document.getElementById('gameCanvas');
window.ctx = window.gameCanvas.getContext('2d');
window.mCanvas = document.getElementById('minimapCanvas');
window.mCtx = window.mCanvas.getContext('2d');

window.addEventListener('resize', () => { 
    window.gameCanvas.width = window.innerWidth; 
    window.gameCanvas.height = window.innerHeight; 
});
window.gameCanvas.width = window.innerWidth; 
window.gameCanvas.height = window.innerHeight;

window.getConvexHull = function(points) {
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
};

window.MAX_HP_MAP = { base: 100, thruster: 80, storage: 120, shooter: 100, armor: 300, harvester: 100, generator: 80, chloroplast: 80, filter: 100, spike: 150, flesh: 50, sensor: 80 };

window.getRelPos = function(objX, objY, camX, camY) {
    let dx = objX - camX;
    let dy = objY - camY;
    if (dx < -window.WORLD_WIDTH / 2) dx += window.WORLD_WIDTH;
    if (dx > window.WORLD_WIDTH / 2) dx -= window.WORLD_WIDTH;
    if (dy < -window.WORLD_HEIGHT / 2) dy += window.WORLD_HEIGHT;
    if (dy > window.WORLD_HEIGHT / 2) dy -= window.WORLD_HEIGHT;
    return { x: window.gameCanvas.width/2 + dx, y: window.gameCanvas.height/2 + dy };
};

window.draw = function() {
    if(!window.isGameRunning) return;

    window.ctx.fillStyle = "#050510";
    window.ctx.fillRect(0, 0, window.gameCanvas.width, window.gameCanvas.height);

    let myOrg = window.gameState[window.myOwnerId];
    if (myOrg && !window.isSpectator && !window.isFreeCamera) {
        window.cameraX += (myOrg.x - window.cameraX) * 0.1;
        window.cameraY += (myOrg.y - window.cameraY) * 0.1;
    }

    window.ctx.save();
    window.ctx.translate(-window.cameraX, -window.cameraY);

    let gridSize = 200;
    let offX = (window.cameraX % gridSize);
    let offY = (window.cameraY % gridSize);
    if(offX < 0) offX += gridSize;
    if(offY < 0) offY += gridSize;

    window.ctx.strokeStyle = "#16ff0011"; window.ctx.lineWidth = 1;
    for (let x = -gridSize; x < window.gameCanvas.width + gridSize; x += gridSize) {
        let drawX = x - offX + (window.gameCanvas.width/2 % gridSize);
        window.ctx.beginPath(); window.ctx.moveTo(drawX, 0); window.ctx.lineTo(drawX, window.gameCanvas.height); window.ctx.stroke();
    }
    for (let y = -gridSize; y < window.gameCanvas.height + gridSize; y += gridSize) {
        let drawY = y - offY + (window.gameCanvas.height/2 % gridSize);
        window.ctx.beginPath(); window.ctx.moveTo(0, drawY); window.ctx.lineTo(window.gameCanvas.width, drawY); window.ctx.stroke();
    }

    [...(window.mapZonesState.dense || []), ...(window.mapZonesState.toxic || []), ...(window.mapZonesState.sunbeams || [])].forEach(z => {
        let pos = window.getRelPos(z.x, z.y, window.cameraX, window.cameraY);
        if (pos.x > -500 && pos.x < window.gameCanvas.width+500 && pos.y > -500 && pos.y < window.gameCanvas.height+500) {
            if (window.mapZonesState.toxic && window.mapZonesState.toxic.includes(z)) {
                let grad = window.ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, z.r);
                grad.addColorStop(0, "rgba(0, 255, 50, 0.3)"); grad.addColorStop(1, "rgba(0, 255, 50, 0)");
                window.ctx.fillStyle = grad;
            } else if (window.mapZonesState.sunbeams && window.mapZonesState.sunbeams.includes(z)) {
                let grad = window.ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, z.r);
                grad.addColorStop(0, "rgba(255, 255, 100, 0.4)"); grad.addColorStop(1, "rgba(255, 255, 100, 0)");
                window.ctx.fillStyle = grad;
            } else {
                window.ctx.fillStyle = "rgba(0, 50, 150, 0.15)";
            }
            window.ctx.beginPath(); window.ctx.arc(pos.x, pos.y, z.r, 0, Math.PI*2); window.ctx.fill();
        }
    });

    if (window.bunkerState) {
        let pos = window.getRelPos(window.bunkerState.x, window.bunkerState.y, window.cameraX, window.cameraY);
        if (pos.x > -200 && pos.x < window.gameCanvas.width+200 && pos.y > -200 && pos.y < window.gameCanvas.height+200) {
            window.ctx.fillStyle = "rgba(255, 255, 0, 0.1)";
            window.ctx.beginPath(); window.ctx.arc(pos.x, pos.y, window.bunkerState.radius, 0, Math.PI*2); window.ctx.fill();
            window.ctx.strokeStyle = "yellow"; window.ctx.lineWidth = 2; window.ctx.stroke();
        }
    }

    window.ctx.fillStyle = "#00d4ff";
    window.foodState.forEach(f => {
        let pos = window.getRelPos(f.x, f.y, window.cameraX, window.cameraY);
        window.ctx.beginPath(); window.ctx.arc(pos.x, pos.y, 3, 0, Math.PI*2); window.ctx.fill();
    });

    window.ctx.fillStyle = "#ff00ff";
    window.mineralState.forEach(m => {
        let pos = window.getRelPos(m.x, m.y, window.cameraX, window.cameraY);
        window.ctx.fillRect(pos.x - 3, pos.y - 3, 6, 6);
    });

    window.ctx.fillStyle = "#ff00ff";
    window.virusState.forEach(v => {
        let pos = window.getRelPos(v.x, v.y, window.cameraX, window.cameraY);
        window.ctx.beginPath(); window.ctx.moveTo(pos.x, pos.y - 8); window.ctx.lineTo(pos.x + 6, pos.y);
        window.ctx.lineTo(pos.x, pos.y + 8); window.ctx.lineTo(pos.x - 6, pos.y); window.ctx.fill();
    });

    window.ctx.fillStyle = "#00ffff";
    window.playerPhageState.forEach(f => {
        let pos = window.getRelPos(f.x, f.y, window.cameraX, window.cameraY);
        window.ctx.beginPath(); window.ctx.moveTo(pos.x, pos.y - 5); window.ctx.lineTo(pos.x + 15, pos.y);
        window.ctx.lineTo(pos.x, pos.y + 5); window.ctx.lineTo(pos.x - 5, pos.y); window.ctx.fill();
    });

    window.ctx.fillStyle = "rgba(255,255,255,0.4)"; window.ctx.strokeStyle = "white";
    window.predatorState.forEach(m => {
        let pos = window.getRelPos(m.x, m.y, window.cameraX, window.cameraY);
        window.ctx.beginPath(); window.ctx.arc(pos.x, pos.y, m.radius, 0, Math.PI*2); window.ctx.fill(); window.ctx.stroke();
    });

    for (let id in window.gameState) {
        let org = window.gameState[id];
        if (!org.nodes || org.nodes.length === 0) continue;

        let anchor = org.nodes[0];
        let anchorScreen = window.getRelPos(anchor.x, anchor.y, window.cameraX, window.cameraY);

        if (anchorScreen.x < -500 || anchorScreen.x > window.gameCanvas.width+500 || anchorScreen.y < -500 || anchorScreen.y > window.gameCanvas.height+500) continue;

        let screenNodes = org.nodes.map(n => {
            let dx = n.x - anchor.x;
            let dy = n.y - anchor.y;
            if (dx < -window.WORLD_WIDTH / 2) dx += window.WORLD_WIDTH;
            if (dx > window.WORLD_WIDTH / 2) dx -= window.WORLD_WIDTH;
            if (dy < -window.WORLD_HEIGHT / 2) dy += window.WORLD_HEIGHT;
            if (dy > window.WORLD_HEIGHT / 2) dy -= window.WORLD_HEIGHT;
            return { ...n, sx: anchorScreen.x + dx, sy: anchorScreen.y + dy };
        });

        if (screenNodes.length >= 3) {
            let hullNodes = screenNodes.map(n => ({x: n.sx, y: n.sy}));
            let hull = window.getConvexHull(hullNodes);
            window.ctx.beginPath(); window.ctx.moveTo(hull[0].x, hull[0].y);
            for (let i = 1; i < hull.length; i++) window.ctx.lineTo(hull[i].x, hull[i].y);
            window.ctx.closePath();
            window.ctx.lineJoin = 'round'; window.ctx.lineWidth = 35;
            window.ctx.fillStyle = id === window.myOwnerId ? "rgba(22, 255, 0, 0.15)" : (org.isNPC ? "rgba(200, 0, 255, 0.15)" : "rgba(255, 0, 0, 0.15)");
            window.ctx.strokeStyle = id === window.myOwnerId ? "rgba(22, 255, 0, 0.3)" : (org.isNPC ? "rgba(200, 0, 255, 0.3)" : "rgba(255, 0, 0, 0.3)");
            window.ctx.stroke(); window.ctx.fill();
        }

        screenNodes.forEach((n) => {
            if (n.type === 'shooter') window.ctx.fillStyle = '#00ffff';
            else if (n.type === 'thruster') window.ctx.fillStyle = 'orange';
            else if (n.type === 'storage') window.ctx.fillStyle = '#ffcc00';
            else if (n.type === 'armor') window.ctx.fillStyle = '#888888';
            else if (n.type === 'harvester') window.ctx.fillStyle = '#ff00aa';
            else if (n.type === 'generator') window.ctx.fillStyle = '#aaff00';
            else if (n.type === 'chloroplast') window.ctx.fillStyle = '#228B22';
            else if (n.type === 'filter') window.ctx.fillStyle = '#FFFFFF';
            else if (n.type === 'spike') window.ctx.fillStyle = '#444444';
            else if (n.type === 'flesh') window.ctx.fillStyle = '#ff6666';
            else if (n.type === 'sensor') window.ctx.fillStyle = '#66ccff';
            else window.ctx.fillStyle = '#16ff00';

            window.ctx.beginPath(); window.ctx.arc(n.sx, n.sy, 14, 0, Math.PI*2); window.ctx.fill();
            window.ctx.strokeStyle = id === window.myOwnerId ? "white" : (org.isNPC ? "#ff00ff" : "red");
            window.ctx.lineWidth = id === window.myOwnerId ? 2 : 1; window.ctx.stroke();

            if (n.type === 'harvester') {
                window.ctx.strokeStyle = "rgba(255, 0, 170, 0.1)";
                window.ctx.beginPath(); window.ctx.arc(n.sx, n.sy, 70, 0, Math.PI*2); window.ctx.stroke();
            }

            let maxHpForType = window.MAX_HP_MAP[n.type] || 100;
            let hpPercent = n.hp / maxHpForType;
            if (hpPercent < 1.0 && hpPercent > 0) {
                window.ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
                window.ctx.lineWidth = 3;
                window.ctx.beginPath(); window.ctx.arc(n.sx, n.sy, 16, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * hpPercent)); window.ctx.stroke();
            }

            window.ctx.font = "14px Arial"; window.ctx.fillStyle = "white"; window.ctx.textAlign = "center"; window.ctx.textBaseline = "middle";
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
            window.ctx.fillText(emoji, n.sx, n.sy);

            if (n.minerals > 0.5) {
                window.ctx.fillStyle = "rgba(255, 0, 255, 0.75)";
                window.ctx.beginPath(); window.ctx.arc(n.sx, n.sy, Math.min(n.minerals * 1.5, 8), 0, Math.PI*2); window.ctx.fill();
            }
        });

        if (id === window.myOwnerId && !window.isSpectator) {
            let pos = window.getRelPos(org.x, org.y, window.cameraX, window.cameraY);
            window.ctx.fillStyle = "rgba(0,0,0,0.8)"; window.ctx.fillRect(pos.x - 20, pos.y - 30, 40, 6);
            window.ctx.fillStyle = org.atp >= 200 ? "#ffaa00" : "#ffffff";
            window.ctx.fillRect(pos.x - 20, pos.y - 30, Math.min((org.atp / 200) * 40, 40), 6);
        }
    }
    window.ctx.restore();

    window.mCtx.fillStyle = "black"; window.mCtx.fillRect(0, 0, 150, 150);
    const scale = 150 / window.WORLD_WIDTH;

    if (window.mapZonesState.toxic) {
        window.mapZonesState.toxic.forEach(z => { window.mCtx.fillStyle = "rgba(0, 255, 50, 0.3)"; window.mCtx.beginPath(); window.mCtx.arc(z.x * scale, z.y * scale, z.r * scale, 0, Math.PI*2); window.mCtx.fill(); });
    }
    if (window.mapZonesState.sunbeams) {
        window.mapZonesState.sunbeams.forEach(z => { window.mCtx.fillStyle = "rgba(255, 255, 100, 0.4)"; window.mCtx.beginPath(); window.mCtx.arc(z.x * scale, z.y * scale, z.r * scale, 0, Math.PI*2); window.mCtx.fill(); });
    }

    if (window.bunkerState) {
        window.mCtx.fillStyle = "rgba(255, 255, 0, 0.4)"; window.mCtx.beginPath(); window.mCtx.arc(window.bunkerState.x * scale, window.bunkerState.y * scale, window.bunkerState.radius * scale, 0, Math.PI*2); window.mCtx.fill();
        window.mCtx.strokeStyle = "yellow"; window.mCtx.lineWidth = 1; window.mCtx.stroke();
    }

    for (let id in window.gameState) {
        let org = window.gameState[id];
        window.mCtx.fillStyle = (id === window.myOwnerId) ? "#16ff00" : (org.isNPC ? "purple" : "red");
        window.mCtx.fillRect(org.x * scale, org.y * scale, 3, 3);
    }

    window.mCtx.strokeStyle = "white"; window.mCtx.lineWidth = 1;
    let mmCamX = window.cameraX * scale;
    let mmCamY = window.cameraY * scale;
    window.mCtx.strokeRect(mmCamX - (window.gameCanvas.width*scale)/2, mmCamY - (window.gameCanvas.height*scale)/2, window.gameCanvas.width * scale, window.gameCanvas.height * scale);

    requestAnimationFrame(window.draw);
};