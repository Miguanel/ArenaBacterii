const config = require('./config');
const npcBlueprints = require('./npcBlueprints');

const organisms = {};
let glucoseParticles = [];
let mineralParticles = [];
let viruses = [];
let playerPhages = [];
const predators = [{ id: 'macro_1', x: 1500, y: 1500, targetX: 1600, targetY: 1600, speed: 1.5, radius: 40 }];
const plutoniumZone = { x: 1500, y: 800, radius: 100 };
let tickCounter = 0;
const mapZones = { sunbeams: [], toxic: [], dense: [] };

function spawnResource(arr, specificX = null, specificY = null) {
    arr.push({ id: Math.random().toString(), x: specificX !== null ? specificX : Math.random() * config.WORLD_WIDTH, y: specificY !== null ? specificY : Math.random() * config.WORLD_HEIGHT });
}

function spawnVirus() {
    return {
        id: Math.random().toString(36).substring(2, 9),
        x: Math.random() * config.WORLD_WIDTH,
        y: Math.random() * config.WORLD_HEIGHT,
        targetX: Math.random() * config.WORLD_WIDTH,
        targetY: Math.random() * config.WORLD_HEIGHT,
        speed: 2.2 // Nieco szybsze, żeby ucieczka była wyzwaniem
    };
}

function initZones() {
    for(let i=0; i<6; i++) {
        mapZones.sunbeams.push({ x: Math.random()*config.WORLD_WIDTH, y: Math.random()*config.WORLD_HEIGHT, r: 150 + Math.random()*150, vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5 });
        mapZones.toxic.push({ x: Math.random()*config.WORLD_WIDTH, y: Math.random()*config.WORLD_HEIGHT, r: 100 + Math.random()*150, vx: (Math.random()-0.5)*0.2, vy: (Math.random()-0.5)*0.2 });
        mapZones.dense.push({ x: Math.random()*config.WORLD_WIDTH, y: Math.random()*config.WORLD_HEIGHT, r: 200 + Math.random()*200, vx: 0, vy: 0 });
    }
}

function updateZones() {
    [mapZones.sunbeams, mapZones.toxic].forEach(zoneArray => {
        zoneArray.forEach(z => {
            z.x += z.vx; z.y += z.vy;
            if(z.x < 0 || z.x > config.WORLD_WIDTH) z.vx *= -1;
            if(z.y < 0 || z.y > config.WORLD_HEIGHT) z.vy *= -1;
        });
    });
}

function spawnNPC() {
    const types = Object.keys(npcBlueprints);
    const selectedType = types[Math.floor(Math.random() * types.length)];
    const bp = npcBlueprints[selectedType];
    const id = 'npc_' + Math.random().toString(36).substring(2, 9);

    let spawnX = Math.random() * config.WORLD_WIDTH;
    let spawnY = Math.random() * config.WORLD_HEIGHT;
    let startingATP = bp.blueprint.reduce((sum, n) => sum + (config.CELLS[n.type]?.cost || 0), 0) + 100;

    let nodes = bp.blueprint.map((n, idx) => ({
        id: id + '_n' + idx, type: n.type,
        x: spawnX + n.x, y: spawnY + n.y,
        vx: 0, vy: 0, lastShot: 0, minerals: 0,
        hp: config.CELLS[n.type].maxHp
    }));

    organisms[id] = {
        id: id, species: bp.name, isNPC: true, aiType: bp.aiType,
        x: spawnX, y: spawnY, targetX: spawnX, targetY: spawnY,
        atp: startingATP, isHidden: false, mutationCooldown: 0,
        blueprint: { nodes: bp.blueprint },
        nodes: nodes
    };
}

function updateNPCAI() {
    let npcCount = 0;
    for (let id in organisms) {
        let org = organisms[id];
        if (!org.isNPC) continue;
        npcCount++;

        let visionRange = 400;
        org.nodes.forEach(n => { if (n.type === 'sensor') visionRange += 200; });

        if (org.aiType === 'plant') {
            let closestSun = null; let minD = 9999;
            mapZones.sunbeams.forEach(z => { let d = Math.hypot(z.x - org.x, z.y - org.y); if (d < minD) { minD = d; closestSun = z; } });
            if (closestSun) { org.targetX = closestSun.x; org.targetY = closestSun.y; }
        } else if (org.aiType === 'predator') {
            let closestPlayer = null; let minD = visionRange;
            for (let pid in organisms) {
                if (pid === id || organisms[pid].isHidden || organisms[pid].isNPC) continue;
                let d = Math.hypot(organisms[pid].x - org.x, organisms[pid].y - org.y);
                if (d < minD) { minD = d; closestPlayer = organisms[pid]; }
            }
            if (closestPlayer) { org.targetX = closestPlayer.x; org.targetY = closestPlayer.y; }
            else if (Math.random() < 0.02) { org.targetX = org.x + (Math.random()*600 - 300); org.targetY = org.y + (Math.random()*600 - 300); }
        } else if (org.aiType === 'roamer') {
            if (Math.hypot(org.targetX - org.x, org.targetY - org.y) < 50 || Math.random() < 0.01) { org.targetX = Math.random() * config.WORLD_WIDTH; org.targetY = Math.random() * config.WORLD_HEIGHT; }
        }
    }
    if (npcCount < config.MAX_NPCS && Math.random() < 0.01) spawnNPC();
}

function init(io) {
    for(let i = 0; i < config.MAX_GLUCOSE; i++) spawnResource(glucoseParticles);
    for(let i = 0; i < config.MAX_MINERALS; i++) spawnResource(mineralParticles);

    // Zwiększamy liczbę wirusów na start
    for(let i = 0; i < 25; i++) viruses.push(spawnVirus());

    initZones();
    for(let i=0; i<config.MAX_NPCS; i++) spawnNPC();

    io.on('connection', (socket) => {
        const playerName = socket.handshake.auth.playerName || "Szczep-" + socket.id.substring(0,4);
        organisms[socket.id] = {
            id: socket.id, species: playerName, isNPC: false,
            x: 1500, y: 1500, targetX: 1500, targetY: 1500,
            atp: 200, isHidden: false, mutationCooldown: 0,
            blueprint: { nodes: [{ x: 0, y: 0, type: 'base' }] },
            nodes: [{ id: 'n1', type: 'base', x: 1500, y: 1500, vx: 0, vy: 0, lastShot: 0, minerals: 0, hp: config.CELLS['base'].maxHp }]
        };
        socket.emit('spawn', { ownerId: socket.id, species: playerName });

        socket.on('chemotaxis', (data) => { if (organisms[socket.id]) { organisms[socket.id].targetX = data.targetX; organisms[socket.id].targetY = data.targetY; } });

        socket.on('exitZone', () => {
            let org = organisms[socket.id];
            if (org && org.isHidden) {
                org.isHidden = false; org.mutationCooldown = Date.now() + 4000;

                if (org.nodes.length > 0) {
                    let coreX = org.x; let coreY = org.y;
                    for(let i = 0; i < org.nodes.length; i++) {
                        org.nodes[i].x = coreX + (Math.random()*10 - 5);
                        org.nodes[i].y = coreY + (Math.random()*10 - 5);
                        org.nodes[i].vx = 0; org.nodes[i].vy = 0;
                        org.nodes[i].hp = config.CELLS[org.nodes[i].type].maxHp; // Darmowe leczenie przy wyjściu z Bunkra!
                    }
                }
            }
        });

        socket.on('saveBlueprint', (blueprint) => {
            let org = organisms[socket.id];
            if (!org || !org.isHidden) return;

            let oldCost = 0;
            for(let i=1; i<org.blueprint.nodes.length; i++) oldCost += config.CELLS[org.blueprint.nodes[i].type].cost;
            let newCost = 0;
            for(let i=1; i<blueprint.nodes.length; i++) newCost += config.CELLS[blueprint.nodes[i].type].cost;

            let finalCost = Math.max(0, newCost - oldCost);
            if (org.atp >= finalCost) {
                org.atp -= finalCost;
                org.blueprint = { nodes: blueprint.nodes.map(n => ({ x: n.x, y: n.y, type: n.type })) };

                let newNodes = [];
                for(let i=0; i<blueprint.nodes.length; i++) {
                    let n = blueprint.nodes[i];
                    if (org.nodes[i]) {
                        org.nodes[i].type = n.type; newNodes.push(org.nodes[i]);
                    } else {
                        newNodes.push({ id: `n_${Math.random().toString(36).substring(2,7)}`, type: n.type, x: org.x + n.x, y: org.y + n.y, vx: 0, vy: 0, lastShot: 0, minerals: 0, hp: config.CELLS[n.type].maxHp });
                    }
                }
                org.nodes = newNodes;
                socket.emit('blueprintSaved');
            } else { socket.emit('errorMsg', "Za mało ATP!"); }
        });

        socket.on('disconnect', () => { delete organisms[socket.id]; });
    });

    setInterval(() => {
        updateZones();
        updateNPCAI();
        updatePhysics(io);
    }, 1000 / 30);
}

function updatePhysics(io) {
    for (let id in organisms) {
        let org = organisms[id];
        let cx = 0, cy = 0;
        org.nodes.forEach(n => { cx += n.x; cy += n.y; });
        if(org.nodes.length > 0) { cx /= org.nodes.length; cy /= org.nodes.length; org.x = cx; org.y = cy; }

        let distToBunker = Math.hypot(org.x - plutoniumZone.x, org.y - plutoniumZone.y);
        org.isHidden = !org.isNPC && distToBunker < plutoniumZone.radius && (!org.mutationCooldown || Date.now() > org.mutationCooldown);

        if (org.isHidden) {
            if (!org.sentMutationTrigger) { io.to(id).emit('enterMutationZone'); org.sentMutationTrigger = true; }
            org.nodes.forEach(n => { n.x += (plutoniumZone.x - org.x) * 0.05; n.y += (plutoniumZone.y - org.y) * 0.05; });
        } else {
            org.sentMutationTrigger = false;
            let dxOrg = org.targetX - org.x; let dyOrg = org.targetY - org.y;
            let distOrg = Math.hypot(dxOrg, dyOrg);
            let targetAngle = Math.atan2(dyOrg, dxOrg) + (Math.PI / 2);

            let totalForceX = 0, totalForceY = 0;
            if (distOrg > 5) {
                org.nodes.forEach(n => {
                    let f = config.CELLS[n.type]?.force || 0;
                    if (f > 0) { totalForceX += (dxOrg/distOrg) * f; totalForceY += (dyOrg/distOrg) * f; org.atp -= 0.02; }
                });
            }
            let accX = org.nodes.length > 0 ? (totalForceX / org.nodes.length) : 0;
            let accY = org.nodes.length > 0 ? (totalForceY / org.nodes.length) : 0;
            let hasFilter = org.nodes.some(n => n.type === 'filter');

            org.nodes.forEach((n, index) => {
                n.vx += accX; n.vy += accY;

                if (org.blueprint && org.blueprint.nodes[index]) {
                    let bpNode = org.blueprint.nodes[index];
                    let idealX = org.x + (bpNode.x * Math.cos(targetAngle) - bpNode.y * Math.sin(targetAngle));
                    let idealY = org.y + (bpNode.x * Math.sin(targetAngle) + bpNode.y * Math.cos(targetAngle));
                    n.vx += (idealX - n.x) * config.PHYSICS.STRUCTURE_PULL;
                    n.vy += (idealY - n.y) * config.PHYSICS.STRUCTURE_PULL;
                }

                if (org.isNPC) {
                    n.vx += (cx - n.x) * 0.03;
                    n.vy += (cy - n.y) * 0.03;
                }

                let localFriction = config.PHYSICS.FRICTION;
                for (let z of mapZones.dense) { if (Math.hypot(n.x - z.x, n.y - z.y) < z.r) { localFriction = config.PHYSICS.DENSE_FRICTION; break; } }

                let isToxic = false;
                for (let z of mapZones.toxic) { if (Math.hypot(n.x - z.x, n.y - z.y) < z.r) { isToxic = true; break; } }
                if (isToxic && !hasFilter) org.atp -= 0.1;

                let isSun = false;
                for (let z of mapZones.sunbeams) { if (Math.hypot(n.x - z.x, n.y - z.y) < z.r) { isSun = true; break; } }
                if (isSun && n.type === 'chloroplast') org.atp += config.CELLS.chloroplast.sunPower;

                n.vx *= localFriction; n.vy *= localFriction;
                let currentSpeed = Math.hypot(n.vx, n.vy);
                if (currentSpeed > config.PHYSICS.MAX_SPEED) { n.vx = (n.vx / currentSpeed) * config.PHYSICS.MAX_SPEED; n.vy = (n.vy / currentSpeed) * config.PHYSICS.MAX_SPEED; }
                n.x += n.vx; n.y += n.vy;

                if (n.type === 'generator') org.atp += config.CELLS.generator.atpGeneration;

                let radius = (n.type === 'harvester') ? config.CELLS.harvester.collectionRadius : 20;
                for(let i=mineralParticles.length-1; i>=0; i--) {
                    if(Math.hypot(n.x-mineralParticles[i].x, n.y-mineralParticles[i].y) < radius && n.minerals < config.CELLS[n.type].mineralCapacity) {
                        n.minerals += 2; mineralParticles.splice(i, 1); spawnResource(mineralParticles);
                    }
                }

                if (n.type === 'shooter' && n.minerals >= config.CELLS.shooter.mineralRequirement && Date.now() - n.lastShot > config.CELLS.shooter.fireRate) {
                    let target = findClosestEnemy(n, config.CELLS.shooter.range, id);
                    if (target) {
                        playerPhages.push({ x: n.x, y: n.y, targetX: target.x, targetY: target.y, speed: config.CELLS.shooter.phageSpeed, owner: id });
                        n.lastShot = Date.now(); n.minerals -= config.CELLS.shooter.mineralRequirement; org.atp -= config.CELLS.shooter.phageCost;
                    }
                }
            });

            for(let i=0; i<org.nodes.length; i++) {
                for(let j=i+1; j<org.nodes.length; j++) {
                    let nA = org.nodes[i], nB = org.nodes[j];
                    let dx = nB.x - nA.x, dy = nB.y - nA.y;
                    let dist = Math.hypot(dx, dy);
                    if (dist === 0) { dx = Math.random()*2-1; dy = Math.random()*2-1; dist = 1; }

                    if (dist < config.PHYSICS.REPULSION_RADIUS) {
                        let f = ((config.PHYSICS.REPULSION_RADIUS - dist) * config.PHYSICS.REPULSION_FORCE) / dist;
                        nA.vx -= dx * f; nA.vy -= dy * f; nB.vx += dx * f; nB.vy += dy * f;
                    }
                    if (dist < 45) {
                        let capB = config.CELLS[nB.type].mineralCapacity, capA = config.CELLS[nA.type].mineralCapacity;
                        if (nA.minerals > 0.1 && nB.minerals < capB) { let f = Math.min(nA.minerals, config.PHYSICS.RESOURCE_FLOW_SPEED); nA.minerals -= f; nB.minerals += f; }
                        if (nB.minerals > 0.1 && nA.minerals < capA) { let f = Math.min(nB.minerals, config.PHYSICS.RESOURCE_FLOW_SPEED); nB.minerals -= f; nA.minerals += f; }
                    }
                }
            }
        }
        for(let i=glucoseParticles.length-1; i>=0; i--) {
            let eaten = false;
            for(let n of org.nodes) {
                let radius = (n.type === 'harvester') ? config.CELLS.harvester.collectionRadius : 20;
                if(Math.hypot(n.x-glucoseParticles[i].x, n.y-glucoseParticles[i].y) < radius) { eaten = true; break; }
            }
            if (eaten) { org.atp += 15; glucoseParticles.splice(i, 1); spawnResource(glucoseParticles); }
        }
    }

    // --- KOLCE ---
    for (let idA in organisms) {
        if(organisms[idA].isHidden) continue;
        organisms[idA].nodes.forEach(nA => {
            if (nA.type === 'spike') {
                for (let idB in organisms) {
                    if (idA === idB || organisms[idB].isHidden) continue;
                    organisms[idB].nodes.forEach(nB => {
                        let dist = Math.hypot(nA.x - nB.x, nA.y - nB.y);
                        if (dist < 28) {
                            let dmg = (nB.type === 'armor') ? 1 : config.CELLS.spike.damage;
                            nB.hp -= dmg;
                            let kx = (nB.x - nA.x) / dist * config.CELLS.spike.knockback;
                            let ky = (nB.y - nA.y) / dist * config.CELLS.spike.knockback;
                            nB.vx += kx; nB.vy += ky;
                        }
                    });
                }
            }
        });
    }

    // --- FIZYKA POCISKÓW ---
    for(let i = playerPhages.length - 1; i >= 0; i--) {
        let f = playerPhages[i]; let dx = f.targetX - f.x, dy = f.targetY - f.y, dist = Math.hypot(dx, dy);
        let hit = false;
        for (let orgId in organisms) {
            if (orgId !== f.owner && !organisms[orgId].isHidden) {
                for (let n of organisms[orgId].nodes) {
                    if (Math.hypot(n.x - f.x, n.y - f.y) < 20) {
                        let dmg = (n.type === 'armor') ? 10 : 40;
                        n.hp -= dmg;
                        hit = true; break;
                    }
                }
            }
            if(hit) break;
        }
        if (!hit) {
            for (let m of predators) {
                if (Math.hypot(m.x - f.x, m.y - f.y) < m.radius) { m.x += (m.x - f.x) * 2; m.y += (m.y - f.y) * 2; hit = true; break; }
            }
        }
        if (hit || dist < 10) playerPhages.splice(i, 1); else { f.x += (dx/dist)*f.speed; f.y += (dy/dist)*f.speed; }
    }

    // --- ZAAWANSOWANA FIZYKA WIRUSÓW ---
    for(let i = viruses.length - 1; i >= 0; i--) {
        let v = viruses[i];
        let hit = false;
        let closestCell = null;
        let minCellDist = 150; // Zasięg "węchu" wirusa (zaczyna gonić ofiarę)

        for (let id in organisms) {
            let org = organisms[id];
            if (org.isHidden) continue;

            for (let n of org.nodes) {
                let dist = Math.hypot(v.x - n.x, v.y - n.y);

                // Dotknięcie i infekcja komórki
                if (dist < 20) {
                    if (n.type === 'filter') {
                        // Filtr pochłania wirusa bez obrażeń
                        org.atp += 5;
                    } else if (n.type === 'armor') {
                        n.hp -= 10;
                    } else {
                        n.hp -= 40; // Głębsze obrażenia
                        org.atp -= 20; // Wirus pożera energię z puli głównej
                    }
                    hit = true;
                    break;
                }

                // AI Gonienia ofiary
                if (dist < minCellDist) {
                    minCellDist = dist;
                    closestCell = n;
                }
            }
            if (hit) break;
        }

        if (hit) {
            viruses.splice(i, 1);
            viruses.push(spawnVirus()); // Respawn od razu na mapie
            continue;
        }

        // Ruch wirusa
        if (closestCell) {
            v.targetX = closestCell.x;
            v.targetY = closestCell.y;
        } else {
            let distV = Math.hypot(v.x - plutoniumZone.x, v.y - plutoniumZone.y);
            // Odbijanie od strefy ochronnej
            if (distV < plutoniumZone.radius + 15) {
                v.targetX = Math.random()*config.WORLD_WIDTH; v.targetY = Math.random()*config.WORLD_HEIGHT;
            }
            if(Math.hypot(v.targetX - v.x, v.targetY - v.y) < 10) {
                v.targetX = Math.random()*config.WORLD_WIDTH; v.targetY = Math.random()*config.WORLD_HEIGHT;
            }
        }

        let dx = v.targetX - v.x, dy = v.targetY - v.y, dist = Math.hypot(dx, dy);
        if(dist > 0) { v.x += (dx/dist)*v.speed; v.y += (dy/dist)*v.speed; }
    }

    // --- AI MAKROFAGA ---
    for(let m of predators) {
        let distToBunker = Math.hypot(m.x - plutoniumZone.x, m.y - plutoniumZone.y);
        if (distToBunker < plutoniumZone.radius + 50) {
            let angle = Math.atan2(m.y - plutoniumZone.y, m.x - plutoniumZone.x);
            m.targetX = m.x + Math.cos(angle)*800; m.targetY = m.y + Math.sin(angle)*800;
        } else {
            let closest = null; let minD = 1000;
            for(let id in organisms) {
                if(organisms[id].isHidden) continue;
                for(let n of organisms[id].nodes) {
                    let d = Math.hypot(m.x - n.x, m.y - n.y);
                    if(d < m.radius) { n.hp -= 20; continue; } // Makrofag odgryza 20 HP
                    if(d < minD) { minD = d; closest = n; }
                }
            }
            if(closest) { m.targetX = closest.x; m.targetY = closest.y; } else if (Math.hypot(m.x-m.targetX, m.y-m.targetY) < 20) { m.targetX = Math.random()*config.WORLD_WIDTH; m.targetY = Math.random()*config.WORLD_HEIGHT; }
        }
        let dist = Math.hypot(m.targetX - m.x, m.targetY - m.y);
        if(dist > 0) { m.x += (m.targetX - m.x)/dist * m.speed; m.y += (m.targetY - m.y)/dist * m.speed; }
    }

    // --- SYSTEM ŚMIERCI KOMÓREK ---
    for (let id in organisms) {
        let org = organisms[id];

        for (let i = org.nodes.length - 1; i >= 0; i--) {
            let n = org.nodes[i];
            if (n.hp <= 0) {
                let drops = n.type === 'flesh' ? 5 : 1;
                for(let k=0; k<drops; k++) spawnResource(glucoseParticles, n.x + (Math.random()*40-20), n.y + (Math.random()*40-20));

                org.nodes.splice(i, 1);
                if (org.blueprint && org.blueprint.nodes) {
                    org.blueprint.nodes.splice(i, 1);
                }
            }
        }

        if(org.nodes.length === 0 || org.atp <= 0) {
            delete organisms[id];
        }
    }

    const stats = {};
    for(let id in organisms) { if(!organisms[id].isNPC) stats[organisms[id].species] = Math.floor(organisms[id].atp); }
    const leaderboard = Object.entries(stats).sort((a,b) => b[1]-a[1]).slice(0,5);
    tickCounter++;
    if (tickCounter % 2 === 0) {
        io.emit('updateMap', { organisms, food: glucoseParticles, minerals: mineralParticles, predators, plutoniumZone, viruses, playerPhages, leaderboard, zones: mapZones });
    }
}

function findClosestEnemy(node, range, myOrgId) {
    let closest = null; let minD = range;
    for (let m of predators) { let d = Math.hypot(m.x - node.x, m.y - node.y); if (d < minD) { minD = d; closest = m; } }
    for (let id in organisms) {
        if (id === myOrgId || organisms[id].isHidden) continue;
        for (let n of organisms[id].nodes) { let d = Math.hypot(n.x - node.x, n.y - node.y); if (d < minD) { minD = d; closest = n; } }
    }
    return closest;
}

module.exports = { init };