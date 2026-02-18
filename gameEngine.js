const config = require('./config');
const npcBlueprints = require('./npcBlueprints');

const organisms = {};
let glucoseParticles = [];
let mineralParticles = [];
let viruses = [];
let playerPhages = [];
const predators = [{ id: 'macro_1', x: 1500, y: 1500, targetX: 1600, targetY: 1600, speed: 1.5, radius: 40 }];
const plutoniumZone = { x: 1500, y: 800, radius: 100 };

const mapZones = { sunbeams: [], toxic: [], dense: [] };
let tickCounter = 0;

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
        speed: 2.2
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

    let spawnX = Math.random() * (config.WORLD_WIDTH - 200) + 100;
    let spawnY = Math.random() * (config.WORLD_HEIGHT - 200) + 100;

    if (Math.hypot(spawnX - plutoniumZone.x, spawnY - plutoniumZone.y) < plutoniumZone.radius + 200) {
        spawnX += 500;
    }

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

    recenterBlueprint(organisms[id]);
}

function updateNPCAI() {
    let npcCount = 0;
    for (let id in organisms) {
        let org = organisms[id];
        if (!org.isNPC) continue;
        npcCount++;

        if (org.x < -5000 || org.x > config.WORLD_WIDTH + 5000 || org.y < -5000 || org.y > config.WORLD_HEIGHT + 5000) {
            delete organisms[id]; continue;
        }

        let visionRange = 400;
        org.nodes.forEach(n => { if (n.type === 'sensor') visionRange += 200; });

        if (org.aiType === 'plant') {
            let closestSun = null; let minD = 9999;
            mapZones.sunbeams.forEach(z => {
                let dx = z.x - org.x;
                let dy = z.y - org.y;
                if (Math.abs(dx) > config.WORLD_WIDTH / 2) dx -= Math.sign(dx) * config.WORLD_WIDTH;
                if (Math.abs(dy) > config.WORLD_HEIGHT / 2) dy -= Math.sign(dy) * config.WORLD_HEIGHT;
                let d = Math.hypot(dx, dy);
                if (d < minD) { minD = d; closestSun = z; }
            });
            if (closestSun) { org.targetX = closestSun.x; org.targetY = closestSun.y; }

        } else if (org.aiType === 'predator') {
            let closestTarget = null; let minD = visionRange;
            for (let pid in organisms) {
                if (pid === id || organisms[pid].isHidden) continue;
                if (organisms[pid].species === org.species) continue;

                let dx = organisms[pid].x - org.x;
                let dy = organisms[pid].y - org.y;
                if (Math.abs(dx) > config.WORLD_WIDTH / 2) dx -= Math.sign(dx) * config.WORLD_WIDTH;
                if (Math.abs(dy) > config.WORLD_HEIGHT / 2) dy -= Math.sign(dy) * config.WORLD_HEIGHT;

                let d = Math.hypot(dx, dy);
                if (d < minD) { minD = d; closestTarget = organisms[pid]; }
            }
            if (closestTarget) {
                org.targetX = closestTarget.x; org.targetY = closestTarget.y;
            }
            else if (Math.random() < 0.02) {
                org.targetX = org.x + (Math.random()*600 - 300);
                org.targetY = org.y + (Math.random()*600 - 300);
            }
        } else if (org.aiType === 'roamer') {
            if (Math.hypot(org.targetX - org.x, org.targetY - org.y) < 50 || Math.random() < 0.01) {
                org.targetX = Math.random() * config.WORLD_WIDTH;
                org.targetY = Math.random() * config.WORLD_HEIGHT;
            }
        }
    }

    if (npcCount < config.MAX_NPCS) {
        if (npcCount === 0 || Math.random() < 0.05) spawnNPC();
    }
}

function recenterBlueprint(org) {
    if (!org.blueprint || !org.blueprint.nodes || org.blueprint.nodes.length === 0) return;
    let sumX = 0, sumY = 0;
    org.blueprint.nodes.forEach(n => { sumX += n.x; sumY += n.y; });
    let avgX = sumX / org.blueprint.nodes.length;
    let avgY = sumY / org.blueprint.nodes.length;
    org.blueprint.nodes.forEach(n => { n.x -= avgX; n.y -= avgY; });
}

function init(io) {
    for(let i = 0; i < config.MAX_GLUCOSE; i++) spawnResource(glucoseParticles);
    for(let i = 0; i < config.MAX_MINERALS; i++) spawnResource(mineralParticles);
    for(let i = 0; i < 25; i++) viruses.push(spawnVirus());
    initZones();
    for(let i=0; i<config.MAX_NPCS; i++) spawnNPC();

    io.on('connection', (socket) => {
        const playerName = socket.handshake.auth.playerName || "Szczep-" + socket.id.substring(0,4);

        organisms[socket.id] = {
            id: socket.id, species: playerName, isNPC: false,
            x: plutoniumZone.x, y: plutoniumZone.y,
            targetX: plutoniumZone.x, targetY: plutoniumZone.y,
            atp: 200, isHidden: true, mutationCooldown: 0,

            blueprint: { nodes: [
                { x: 0, y: 0, type: 'base' },
                { x: 0, y: 25, type: 'thruster' }
            ]},

            nodes: [
                { id: 'n1', type: 'base', x: plutoniumZone.x, y: plutoniumZone.y, vx: 0, vy: 0, lastShot: 0, minerals: 0, hp: config.CELLS['base'].maxHp },
                { id: 'n2', type: 'thruster', x: plutoniumZone.x, y: plutoniumZone.y + 25, vx: 0, vy: 0, lastShot: 0, minerals: 0, hp: config.CELLS['thruster'].maxHp }
            ]
        };
        recenterBlueprint(organisms[socket.id]);

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
                        org.nodes[i].hp = config.CELLS[org.nodes[i].type].maxHp;
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
                        org.nodes[i].type = n.type;
                        org.nodes[i].hp = config.CELLS[n.type].maxHp;
                        newNodes.push(org.nodes[i]);
                    }
                    else {
                        newNodes.push({
                            id: `n_${Math.random().toString(36).substring(2,7)}`,
                            type: n.type,
                            x: org.x + n.x, y: org.y + n.y, vx: 0, vy: 0, lastShot: 0, minerals: 0,
                            hp: config.CELLS[n.type].maxHp
                        });
                    }
                }
                org.nodes = newNodes;
                recenterBlueprint(org);
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
    let orgIds = Object.keys(organisms);

    // --- FIZYCZNE KOLIZJE MIĘDZY ORGANIZMAMI (BODY COLLISION) ---
    for (let i = 0; i < orgIds.length; i++) {
        for (let j = i + 1; j < orgIds.length; j++) {
            let orgA = organisms[orgIds[i]];
            let orgB = organisms[orgIds[j]];

            if (orgA.isHidden || orgB.isHidden) continue;

            for (let nA of orgA.nodes) {
                for (let nB of orgB.nodes) {
                    let dx = nA.x - nB.x;
                    let dy = nA.y - nB.y;

                    if (Math.abs(dx) > config.WORLD_WIDTH / 2) dx -= Math.sign(dx) * config.WORLD_WIDTH;
                    if (Math.abs(dy) > config.WORLD_HEIGHT / 2) dy -= Math.sign(dy) * config.WORLD_HEIGHT;

                    let dist = Math.hypot(dx, dy);
                    let minDist = config.PHYSICS.BODY_COLLISION_RADIUS;

                    if (dist < minDist && dist > 0) {
                        let force = (minDist - dist) / minDist * config.PHYSICS.BODY_COLLISION_FORCE;
                        let fx = (dx / dist) * force;
                        let fy = (dy / dist) * force;

                        nA.vx += fx;
                        nA.vy += fy;
                        nB.vx -= fx;
                        nB.vy -= fy;
                    }
                }
            }
        }
    }

    for (let id in organisms) {
        let org = organisms[id];
        let cx = 0, cy = 0;

        let thrusterCount = org.nodes.filter(n => n.type === 'thruster').length;
        let dynamicMaxSpeed = config.PHYSICS.BASE_SPEED + (thrusterCount * config.PHYSICS.THRUSTER_BONUS);
        if (dynamicMaxSpeed > config.PHYSICS.ABSOLUTE_MAX_SPEED) { dynamicMaxSpeed = config.PHYSICS.ABSOLUTE_MAX_SPEED; }

        org.nodes.forEach(n => { cx += n.x; cy += n.y; });
        if(org.nodes.length > 0) { cx /= org.nodes.length; cy /= org.nodes.length; org.x = cx; org.y = cy; }

        let wrapX = 0; let wrapY = 0;
        if (cx < 0) wrapX = config.WORLD_WIDTH;
        else if (cx >= config.WORLD_WIDTH) wrapX = -config.WORLD_WIDTH;
        if (cy < 0) wrapY = config.WORLD_HEIGHT;
        else if (cy >= config.WORLD_HEIGHT) wrapY = -config.WORLD_HEIGHT;

        if (wrapX !== 0 || wrapY !== 0) {
            org.x += wrapX; org.y += wrapY;
            org.nodes.forEach(n => { n.x += wrapX; n.y += wrapY; });
            if(org.isNPC) { org.targetX += wrapX; org.targetY += wrapY; }
        }

        let distToBunker = Math.hypot(org.x - plutoniumZone.x, org.y - plutoniumZone.y);
        org.isHidden = !org.isNPC && distToBunker < plutoniumZone.radius && (!org.mutationCooldown || Date.now() > org.mutationCooldown);

        if (org.isHidden) {
            if (!org.sentMutationTrigger) { io.to(id).emit('enterMutationZone'); org.sentMutationTrigger = true; }
            org.nodes.forEach(n => { n.x += (plutoniumZone.x - org.x) * 0.05; n.y += (plutoniumZone.y - org.y) * 0.05; });
        } else {
            org.sentMutationTrigger = false;
            let dxOrg = org.targetX - org.x; let dyOrg = org.targetY - org.y;
            if (Math.abs(dxOrg) > config.WORLD_WIDTH / 2) dxOrg -= Math.sign(dxOrg) * config.WORLD_WIDTH;
            if (Math.abs(dyOrg) > config.WORLD_HEIGHT / 2) dyOrg -= Math.sign(dyOrg) * config.WORLD_HEIGHT;

            let distOrg = Math.hypot(dxOrg, dyOrg);
            let targetAngle = Math.atan2(dyOrg, dxOrg) + (Math.PI / 2);

            let totalForceX = 0, totalForceY = 0;
            if (distOrg > 5) {
                org.nodes.forEach(n => {
                    let f = config.CELLS[n.type]?.force || 0;
                    if (f > 0) {
                        totalForceX += (dxOrg/distOrg) * f;
                        totalForceY += (dyOrg/distOrg) * f;
                        org.atp -= 0.02;
                    }
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

                    let dxStruct = idealX - n.x; let dyStruct = idealY - n.y;
                    if (Math.abs(dxStruct) > config.WORLD_WIDTH / 2) dxStruct -= Math.sign(dxStruct) * config.WORLD_WIDTH;
                    if (Math.abs(dyStruct) > config.WORLD_HEIGHT / 2) dyStruct -= Math.sign(dyStruct) * config.WORLD_HEIGHT;

                    n.vx += dxStruct * config.PHYSICS.STRUCTURE_PULL;
                    n.vy += dyStruct * config.PHYSICS.STRUCTURE_PULL;
                }

                if (org.isNPC) {
                    let dxG = cx - n.x; let dyG = cy - n.y;
                    if (Math.abs(dxG) > config.WORLD_WIDTH / 2) dxG -= Math.sign(dxG) * config.WORLD_WIDTH;
                    if (Math.abs(dyG) > config.WORLD_HEIGHT / 2) dyG -= Math.sign(dyG) * config.WORLD_HEIGHT;
                    n.vx += dxG * 0.03; n.vy += dyG * 0.03;

                    let distNodeBunker = Math.hypot(n.x - plutoniumZone.x, n.y - plutoniumZone.y);
                    if (distNodeBunker < plutoniumZone.radius + 50) {
                        let angle = Math.atan2(n.y - plutoniumZone.y, n.x - plutoniumZone.x);
                        n.vx += Math.cos(angle) * 1.5;
                        n.vy += Math.sin(angle) * 1.5;
                    }
                }

                let localFriction = config.PHYSICS.FRICTION;
                for (let z of mapZones.dense) {
                    let distZ = Math.hypot(n.x - z.x, n.y - z.y);
                    if (distZ < z.r) { localFriction = config.PHYSICS.DENSE_FRICTION; break; }
                }

                let isToxic = false;
                for (let z of mapZones.toxic) { if (Math.hypot(n.x - z.x, n.y - z.y) < z.r) { isToxic = true; break; } }
                if (isToxic && !hasFilter) org.atp -= 0.1;

                let isSun = false;
                for (let z of mapZones.sunbeams) { if (Math.hypot(n.x - z.x, n.y - z.y) < z.r) { isSun = true; break; } }
                if (isSun && n.type === 'chloroplast') org.atp += config.CELLS.chloroplast.sunPower;

                n.vx *= localFriction; n.vy *= localFriction;

                let currentSpeed = Math.hypot(n.vx, n.vy);
                if (currentSpeed > dynamicMaxSpeed) {
                    n.vx = (n.vx / currentSpeed) * dynamicMaxSpeed;
                    n.vy = (n.vy / currentSpeed) * dynamicMaxSpeed;
                }

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

                    if (Math.abs(dx) > config.WORLD_WIDTH / 2) dx -= Math.sign(dx) * config.WORLD_WIDTH;
                    if (Math.abs(dy) > config.WORLD_HEIGHT / 2) dy -= Math.sign(dy) * config.WORLD_HEIGHT;

                    let dist = Math.hypot(dx, dy);
                    if (dist === 0) { dx = 1; dy = 0; dist = 1; }

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

    for (let idA in organisms) {
        if(organisms[idA].isHidden) continue;
        organisms[idA].nodes.forEach(nA => {
            if (nA.type === 'spike') {
                for (let idB in organisms) {
                    if (idA === idB || organisms[idB].isHidden) continue;
                    organisms[idB].nodes.forEach(nB => {
                        let dx = nA.x - nB.x; let dy = nA.y - nB.y;
                        if (Math.abs(dx) > config.WORLD_WIDTH / 2) dx -= Math.sign(dx) * config.WORLD_WIDTH;
                        if (Math.abs(dy) > config.WORLD_HEIGHT / 2) dy -= Math.sign(dy) * config.WORLD_HEIGHT;

                        let dist = Math.hypot(dx, dy);
                        if (dist < 28) {
                            let dmg = (nB.type === 'armor') ? 1 : config.CELLS.spike.damage;
                            nB.hp -= dmg;
                            let kx = -dx / dist * config.CELLS.spike.knockback;
                            let ky = -dy / dist * config.CELLS.spike.knockback;
                            nB.vx += kx; nB.vy += ky;
                        }
                    });
                }
            }
        });
    }

    for(let i = playerPhages.length - 1; i >= 0; i--) {
        let f = playerPhages[i];

        let dx = f.targetX - f.x, dy = f.targetY - f.y;
        if (Math.abs(dx) > config.WORLD_WIDTH / 2) dx -= Math.sign(dx) * config.WORLD_WIDTH;
        if (Math.abs(dy) > config.WORLD_HEIGHT / 2) dy -= Math.sign(dy) * config.WORLD_HEIGHT;
        let dist = Math.hypot(dx, dy);

        let hit = false;
        for (let orgId in organisms) {
            if (orgId !== f.owner && !organisms[orgId].isHidden) {
                for (let n of organisms[orgId].nodes) {
                    let hdx = n.x - f.x; let hdy = n.y - f.y;
                    if (Math.abs(hdx) > config.WORLD_WIDTH / 2) hdx -= Math.sign(hdx) * config.WORLD_WIDTH;
                    if (Math.abs(hdy) > config.WORLD_HEIGHT / 2) hdy -= Math.sign(hdy) * config.WORLD_HEIGHT;

                    if (Math.hypot(hdx, hdy) < 20) {
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

        if (hit || dist < 10) {
            playerPhages.splice(i, 1);
        } else {
            f.x += (dx/dist)*f.speed;
            f.y += (dy/dist)*f.speed;
            if (f.x < 0) f.x += config.WORLD_WIDTH;
            if (f.x >= config.WORLD_WIDTH) f.x -= config.WORLD_WIDTH;
            if (f.y < 0) f.y += config.WORLD_HEIGHT;
            if (f.y >= config.WORLD_HEIGHT) f.y -= config.WORLD_HEIGHT;
        }
    }

    for(let i = viruses.length - 1; i >= 0; i--) {
        let v = viruses[i];
        let hit = false;
        let closestCell = null;
        let minCellDist = 150;

        for (let id in organisms) {
            let org = organisms[id];
            if (org.isHidden) continue;
            for (let n of org.nodes) {
                let dist = Math.hypot(v.x - n.x, v.y - n.y);
                if (dist < 20) {
                    if (n.type === 'filter') { org.atp += 5; }
                    else if (n.type === 'armor') { n.hp -= 10; }
                    else { n.hp -= 40; org.atp -= 20; }
                    hit = true; break;
                }
                if (dist < minCellDist) { minCellDist = dist; closestCell = n; }
            }
            if (hit) break;
        }

        if (hit) { viruses.splice(i, 1); viruses.push(spawnVirus()); continue; }

        if (closestCell) { v.targetX = closestCell.x; v.targetY = closestCell.y; }
        else {
            if(Math.hypot(v.targetX - v.x, v.targetY - v.y) < 10) { v.targetX = Math.random()*config.WORLD_WIDTH; v.targetY = Math.random()*config.WORLD_HEIGHT; }
        }

        let dx = v.targetX - v.x, dy = v.targetY - v.y;
        let dist = Math.hypot(dx, dy);

        let distBunker = Math.hypot(v.x - plutoniumZone.x, v.y - plutoniumZone.y);
        if (distBunker < plutoniumZone.radius + 100) {
            let angle = Math.atan2(v.y - plutoniumZone.y, v.x - plutoniumZone.x);
            v.x += Math.cos(angle) * 3.0;
            v.y += Math.sin(angle) * 3.0;
        } else if(dist > 0) {
            v.x += (dx/dist)*v.speed; v.y += (dy/dist)*v.speed;
        }

        if (v.x < 0) v.x += config.WORLD_WIDTH;
        if (v.x >= config.WORLD_WIDTH) v.x -= config.WORLD_WIDTH;
        if (v.y < 0) v.y += config.WORLD_HEIGHT;
        if (v.y >= config.WORLD_HEIGHT) v.y -= config.WORLD_HEIGHT;
    }

    for(let m of predators) {
        let closest = null; let minD = 1000;
        for(let id in organisms) {
            if(organisms[id].isHidden) continue;
            for(let n of organisms[id].nodes) {
                let d = Math.hypot(m.x - n.x, m.y - n.y);
                if(d < m.radius) { n.hp -= 20; continue; }
                if(d < minD) { minD = d; closest = n; }
            }
        }
        if(closest) { m.targetX = closest.x; m.targetY = closest.y; }
        else if (Math.hypot(m.x-m.targetX, m.y-m.targetY) < 20) { m.targetX = Math.random()*config.WORLD_WIDTH; m.targetY = Math.random()*config.WORLD_HEIGHT; }

        let dx = m.targetX - m.x; let dy = m.targetY - m.y;
        let dist = Math.hypot(dx, dy);

        let distBunker = Math.hypot(m.x - plutoniumZone.x, m.y - plutoniumZone.y);
        if (distBunker < plutoniumZone.radius + 150) {
             let angle = Math.atan2(m.y - plutoniumZone.y, m.x - plutoniumZone.x);
             m.x += Math.cos(angle) * 2.0;
             m.y += Math.sin(angle) * 2.0;
        } else if(dist > 0) {
            m.x += (dx/dist)*m.speed; m.y += (dy/dist)*m.speed;
        }

        if (m.x < 0) m.x += config.WORLD_WIDTH;
        if (m.x >= config.WORLD_WIDTH) m.x -= config.WORLD_WIDTH;
        if (m.y < 0) m.y += config.WORLD_HEIGHT;
        if (m.y >= config.WORLD_HEIGHT) m.y -= config.WORLD_HEIGHT;
    }

    for (let id in organisms) {
        let org = organisms[id];
        let nodesDied = false;

        for (let i = org.nodes.length - 1; i >= 0; i--) {
            let n = org.nodes[i];
            if (n.hp <= 0) {
                let drops = n.type === 'flesh' ? 5 : 1;
                for(let k=0; k<drops; k++) spawnResource(glucoseParticles, n.x + (Math.random()*40-20), n.y + (Math.random()*40-20));

                org.nodes.splice(i, 1);
                if (org.blueprint && org.blueprint.nodes) { org.blueprint.nodes.splice(i, 1); }

                nodesDied = true;
            }
        }

        if (nodesDied && org.nodes.length > 0) {
            recenterBlueprint(org);
        }

        if(org.nodes.length === 0 || org.atp <= 0) { delete organisms[id]; }
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
    for (let m of predators) {
        let dx = m.x - node.x; let dy = m.y - node.y;
        if (Math.abs(dx) > config.WORLD_WIDTH / 2) dx -= Math.sign(dx) * config.WORLD_WIDTH;
        if (Math.abs(dy) > config.WORLD_HEIGHT / 2) dy -= Math.sign(dy) * config.WORLD_HEIGHT;
        let d = Math.hypot(dx, dy);
        if (d < minD) { minD = d; closest = m; }
    }
    for (let id in organisms) {
        if (id === myOrgId || organisms[id].isHidden) continue;

        if (organisms[myOrgId].isNPC && organisms[id].isNPC) {
             if (organisms[myOrgId].species === organisms[id].species) continue;
        }

        for (let n of organisms[id].nodes) {
            let dx = n.x - node.x; let dy = n.y - node.y;
            if (Math.abs(dx) > config.WORLD_WIDTH / 2) dx -= Math.sign(dx) * config.WORLD_WIDTH;
            if (Math.abs(dy) > config.WORLD_HEIGHT / 2) dy -= Math.sign(dy) * config.WORLD_HEIGHT;
            let d = Math.hypot(dx, dy);
            if (d < minD) { minD = d; closest = n; }
        }
    }
    return closest;
}

module.exports = { init };