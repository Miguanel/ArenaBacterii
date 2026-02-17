// npcBlueprints.js - ZAGĘSZCZONE WERSJE
module.exports = {
    flora: {
        name: "Alga Słoneczna",
        aiType: "plant",
        blueprint: [
            // Ciasno upakowana kulka
            { x: 0, y: 0, type: 'base' },
            { x: -20, y: -20, type: 'chloroplast' },
            { x: 20, y: -20, type: 'chloroplast' },
            { x: -20, y: 20, type: 'flesh' },
            { x: 20, y: 20, type: 'flesh' },
            { x: 0, y: -35, type: 'chloroplast' },
            { x: 0, y: 35, type: 'flesh' }
        ]
    },
    hunter: {
        name: "Cierniowiec",
        aiType: "predator",
        blueprint: [
            // Smukły, zwarty kształt strzały
            { x: 0, y: 0, type: 'base' },
            { x: 25, y: 0, type: 'spike' }, // Kolec bliżej
            { x: -20, y: -18, type: 'thruster' }, // Silniki bliżej kadłuba
            { x: -20, y: 18, type: 'thruster' },
            { x: 0, y: -22, type: 'sensor' },
            { x: 0, y: 22, type: 'sensor' }
        ]
    },
    scavenger: {
        name: "Odkurzacz",
        aiType: "roamer",
        blueprint: [
            // Zwarty zbieracz
            { x: 0, y: 0, type: 'base' },
            { x: 25, y: 0, type: 'harvester' },
            { x: -25, y: 0, type: 'thruster' },
            { x: 0, y: 22, type: 'storage' },
            { x: 0, y: -22, type: 'storage' }
        ]
    }
};