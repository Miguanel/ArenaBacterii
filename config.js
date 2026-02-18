module.exports = {
    WORLD_WIDTH: 3000,
    WORLD_HEIGHT: 3000,
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    MAX_GLUCOSE: 300,
    MAX_MINERALS: 100,
    MAX_NPCS: 15,

    PHYSICS: {
        FRICTION: 0.9,
        DENSE_FRICTION: 0.65,

        BASE_SPEED: 0.5,
        THRUSTER_BONUS: 1.0,
        ABSOLUTE_MAX_SPEED: 15.5,

        // --- ZWIĘKSZONA SIŁA KOLIZJI ---
        BODY_COLLISION_RADIUS: 30,
        BODY_COLLISION_FORCE: 5.0, // Zwiększono z 1.2 na 5.0 (Twarde zderzenia!)

        STRUCTURE_PULL: 0.35,
        SPINE_GRAVITY: 0.0,
        REPULSION_RADIUS: 28,
        REPULSION_FORCE: 0.4,
        ROTATION_SPEED: 0.15,
        RESOURCE_FLOW_SPEED: 0.2
    },

    CELLS: {
        // Base force 0.3
        base: { cost: 100, force: 0.3, mineralCapacity: 2, maxHp: 100 },

        // Thruster nadal jest głównym napędem (3.0)
        thruster: { cost: 150, force: 3.0, mineralCapacity: 1, maxHp: 80 },

        // WSZYSTKIE INNE MAJĄ TERAZ FORCE 0.3
        storage: { cost: 200, force: 0.3, mineralCapacity: 20, maxHp: 120 },
        shooter: { cost: 250, force: 0.3, fireRate: 1500, range: 300, phageSpeed: 6, phageCost: 5, mineralRequirement: 1, mineralCapacity: 3, maxHp: 100 },
        armor: { cost: 50, force: 0.3, mineralCapacity: 0, maxHp: 300 },
        harvester: { cost: 150, force: 0.3, mineralCapacity: 5, collectionRadius: 70, maxHp: 100 },
        generator: { cost: 300, force: 0.3, mineralCapacity: 0, atpGeneration: 0.1, maxHp: 80 },
        chloroplast: { cost: 150, force: 0.3, mineralCapacity: 0, sunPower: 0.5, maxHp: 80 },
        filter: { cost: 200, force: 0.3, mineralCapacity: 0, maxHp: 100 },
        spike: { cost: 250, force: 0.3, mineralCapacity: 0, damage: 2.0, knockback: 4.0, maxHp: 150 },
        flesh: { cost: 50, force: 0.3, mineralCapacity: 0, maxHp: 50 },
        sensor: { cost: 150, force: 0.3, mineralCapacity: 0, maxHp: 80 }
    }
};