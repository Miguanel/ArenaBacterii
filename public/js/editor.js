const eCanvas = document.getElementById('editorCanvas');
const eCtx = eCanvas.getContext('2d');

let edNodes = [];
let currentTool = 'base';
let draggedNodeIndex = -1;
let originalCost = 0;

let editorZoom = 1.0;
let editorPanX = 0;
let editorPanY = 0;
let isPanning = false;

const EDITOR_COSTS = { base: 100, thruster: 150, storage: 200, shooter: 250, armor: 50, harvester: 150, generator: 300, chloroplast: 150, filter: 200, spike: 250, flesh: 50, sensor: 150 };
const EDITOR_STORAGE = { base: 2, thruster: 1, storage: 20, shooter: 3, armor: 0, harvester: 5, generator: 0, chloroplast: 0, filter: 0, spike: 0, flesh: 0, sensor: 0 };

function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('tool-active'));
    document.getElementById('tool_' + tool).classList.add('tool-active');
    draggedNodeIndex = -1;
}

function loadEditor() {
    let myOrg = gameState[myOwnerId];
    editorZoom = 1.0; editorPanX = 0; editorPanY = 0;

    if (!myOrg || !myOrg.blueprint) {
        edNodes = [{ x: 250, y: 175, type: 'base' }];
        originalCost = 0;
    } else {
        edNodes = myOrg.blueprint.nodes.map(n => ({ x: 250 + n.x, y: 175 + n.y, type: n.type }));
        originalCost = 0;
        for(let i=1; i<edNodes.length; i++) originalCost += EDITOR_COSTS[edNodes[i].type] || 0;
    }

    draggedNodeIndex = -1;
    updateEditorStats(); drawEditor();
}

function updateEditorStats() {
    let currentCost = 0; let totalStorage = 0;
    for(let i=1; i<edNodes.length; i++) currentCost += EDITOR_COSTS[edNodes[i].type] || 0;

    let displayCost = Math.max(0, currentCost - originalCost);
    document.getElementById('blueprintCost').innerText = displayCost;

    let speedPower = 0; let firePower = 0; let mass = edNodes.length;
    edNodes.forEach(n => {
        if(n.type === 'base') speedPower += 1.0;
        if(n.type === 'thruster') speedPower += 3.0;
        if(n.type === 'shooter') firePower += 1;
        totalStorage += EDITOR_STORAGE[n.type] || 0;
    });

    let agility = mass > 0 ? (speedPower / mass).toFixed(2) : 0;
    document.getElementById('statSpeed').innerText = agility;
    document.getElementById('statMass').innerText = mass;
    document.getElementById('statFire').innerText = firePower;
    document.getElementById('statStorage').innerText = totalStorage;
}

eCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomAmount = 0.1;
    if (e.deltaY < 0) editorZoom += zoomAmount;
    else editorZoom -= zoomAmount;
    if (editorZoom < 0.3) editorZoom = 0.3;
    if (editorZoom > 3.0) editorZoom = 3.0;
    drawEditor();
});

eCanvas.addEventListener('contextmenu', e => e.preventDefault());

eCanvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) { isPanning = true; return; }

    let rect = eCanvas.getBoundingClientRect();
    let mx = (e.clientX - rect.left - 250 - editorPanX) / editorZoom + 250;
    let my = (e.clientY - rect.top - 175 - editorPanY) / editorZoom + 175;

    let clickedIdx = -1;
    for(let i=0; i<edNodes.length; i++) {
        if(Math.sqrt((mx-edNodes[i].x)**2 + (my-edNodes[i].y)**2) < 15) { clickedIdx = i; break; }
    }

    if (currentTool === 'delete') {
        if (clickedIdx > 0) edNodes.splice(clickedIdx, 1);
    } else if (currentTool === 'move') {
        if (clickedIdx > 0) draggedNodeIndex = clickedIdx;
    } else {
        if(clickedIdx === -1) edNodes.push({ x: mx, y: my, type: currentTool });
    }

    updateEditorStats(); drawEditor();
});

eCanvas.addEventListener('mousemove', (e) => {
    if (isPanning) { editorPanX += e.movementX; editorPanY += e.movementY; drawEditor(); return; }

    if (currentTool === 'move' && draggedNodeIndex !== -1) {
        let rect = eCanvas.getBoundingClientRect();
        edNodes[draggedNodeIndex].x = (e.clientX - rect.left - 250 - editorPanX) / editorZoom + 250;
        edNodes[draggedNodeIndex].y = (e.clientY - rect.top - 175 - editorPanY) / editorZoom + 175;
        drawEditor();
    }
});

eCanvas.addEventListener('mouseup', (e) => { if (e.button === 2) isPanning = false; draggedNodeIndex = -1; });
eCanvas.addEventListener('mouseleave', () => { isPanning = false; draggedNodeIndex = -1; });

function drawEditor() {
    eCtx.clearRect(0, 0, eCanvas.width, eCanvas.height);
    eCtx.save();

    eCtx.translate(250 + editorPanX, 175 + editorPanY);
    eCtx.scale(editorZoom, editorZoom);
    eCtx.translate(-250, -175);

    eCtx.strokeStyle = "#333";
    for(let i = -1000; i < 1500; i+=20) {
        eCtx.beginPath(); eCtx.moveTo(i, -1000); eCtx.lineTo(i, 1500); eCtx.stroke();
        eCtx.beginPath(); eCtx.moveTo(-1000, i); eCtx.lineTo(1500, i); eCtx.stroke();
    }

    edNodes.forEach((n, idx) => {
        if (n.type === 'shooter') eCtx.fillStyle = '#00ffff';
        else if (n.type === 'thruster') eCtx.fillStyle = 'orange';
        else if (n.type === 'storage') eCtx.fillStyle = '#ffcc00';
        else if (n.type === 'armor') eCtx.fillStyle = '#888888';
        else if (n.type === 'harvester') eCtx.fillStyle = '#ff00aa';
        else if (n.type === 'generator') eCtx.fillStyle = '#aaff00';
        else if (n.type === 'chloroplast') eCtx.fillStyle = '#228B22'; // Zielony roślinny
        else if (n.type === 'filter') eCtx.fillStyle = '#FFFFFF';      // Biały z niebieską nutą
        else if (n.type === 'spike') eCtx.fillStyle = '#444444';       // Ciemnoszary szpikulec
        else if (n.type === 'flesh') eCtx.fillStyle = '#ff6666';       // Różowe mięso
        else if (n.type === 'sensor') eCtx.fillStyle = '#66ccff';      // Jasnoniebieski radar
        else eCtx.fillStyle = '#16ff00';

        eCtx.beginPath(); eCtx.arc(n.x, n.y, 12, 0, Math.PI*2); eCtx.fill();

        eCtx.strokeStyle = idx === 0 ? "white" : "black";
        eCtx.lineWidth = 2; eCtx.stroke();

        eCtx.font = "12px Arial"; eCtx.textAlign = "center"; eCtx.textBaseline = "middle";
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
        eCtx.fillText(emoji, n.x, n.y);
    });

    eCtx.restore();
}

function saveOrganism() {
    let cx = 0, cy = 0;
    edNodes.forEach(n => { cx += n.x; cy += n.y; });
    cx /= edNodes.length; cy /= edNodes.length;

    let payloadNodes = edNodes.map(n => ({ x: n.x - cx, y: n.y - cy, type: n.type }));
    if(socket) socket.emit('saveBlueprint', { nodes: payloadNodes });
}