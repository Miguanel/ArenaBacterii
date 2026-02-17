module.exports = {
    WORLD_WIDTH: 3000,
    WORLD_HEIGHT: 3000,
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    MAX_GLUCOSE: 4000,
    MAX_MINERALS: 1500,
    MAX_NPCS: 25,

    PHYSICS: {
        FRICTION: 0.82,
        DENSE_FRICTION: 0.65,
        MAX_SPEED: 8.0,
        STRUCTURE_PULL: 0.35,
        SPINE_GRAVITY: 0.0,
        REPULSION_RADIUS: 28,
        REPULSION_FORCE: 0.4,
        ROTATION_SPEED: 0.15,
        RESOURCE_FLOW_SPEED: 0.2
    },

    CELLS: {
        base: { cost: 100, force: 1.0, mineralCapacity: 2, maxHp: 100 },
        thruster: { cost: 150, force: 3.0, mineralCapacity: 1, maxHp: 80 },
        storage: { cost: 200, force: 0.1, mineralCapacity: 20, maxHp: 120 },
        shooter: { cost: 250, force: 0, fireRate: 1500, range: 300, phageSpeed: 6, phageCost: 5, mineralRequirement: 1, mineralCapacity: 3, maxHp: 100 },
        armor: { cost: 50, force: 0, mineralCapacity: 0, maxHp: 300 }, // Pancerz to teraz prawdziwy czołg!
        harvester: { cost: 150, force: 0.1, mineralCapacity: 5, collectionRadius: 70, maxHp: 100 },
        generator: { cost: 300, force: 0, mineralCapacity: 0, atpGeneration: 0.1, maxHp: 80 },
        chloroplast: { cost: 150, force: 0, mineralCapacity: 0, sunPower: 0.5, maxHp: 80 },
        filter: { cost: 200, force: 0, mineralCapacity: 0, maxHp: 100 },
        spike: { cost: 250, force: 0, mineralCapacity: 0, damage: 2.0, knockback: 4.0, maxHp: 150 },
        flesh: { cost: 50, force: 0, mineralCapacity: 0, maxHp: 50 }, // Mięso jest bardzo kruche
        sensor: { cost: 150, force: 0, mineralCapacity: 0, maxHp: 80 }
    }
};