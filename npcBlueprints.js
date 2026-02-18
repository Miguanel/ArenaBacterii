module.exports = {
    predator: {
        name: "Łowca",
        aiType: "predator", // Agresywne AI
        blueprint: [
            // --- PRZÓD (BROŃ) ---
            // Ujemne Y to przód w naszym silniku fizycznym
            { x: 0, y: -35, type: 'spike' },   // Główny kolec (taran)
            { x: -15, y: -20, type: 'spike' }, // Boczny kolec lewy
            { x: 15, y: -20, type: 'spike' },  // Boczny kolec prawy

            // --- ŚRODEK (CIAŁO) ---
            { x: 0, y: 0, type: 'base' },      // Rdzeń
            { x: 0, y: 15, type: 'generator' },// Generator energii
            { x: -15, y: 0, type: 'armor' },   // Osłona boku
            { x: 15, y: 0, type: 'armor' },    // Osłona boku

            // --- TYŁ (NAPĘD) ---
            // Dodatnie Y to tył
            { x: 0, y: 35, type: 'thruster' }, // Główny silnik
            { x: -20, y: 25, type: 'thruster' }, // Silnik manewrowy
            { x: 20, y: 25, type: 'thruster' }   // Silnik manewrowy
        ]
    },

    tank: {
        name: "Pancernik",
        aiType: "roamer", // Spokojnie zwiedza
        blueprint: [
            { x: 0, y: 0, type: 'base' },
            { x: 0, y: -20, type: 'armor' },
            { x: 0, y: 20, type: 'armor' },
            { x: -20, y: 0, type: 'armor' },
            { x: 20, y: 0, type: 'armor' },
            { x: -15, y: -15, type: 'storage' },
            { x: 15, y: -15, type: 'storage' },
            { x: 0, y: 40, type: 'thruster' } // Mały silnik, jest powolny
        ]
    },

    plant: {
        name: "Flora",
        aiType: "plant", // Szuka słońca
        blueprint: [
            { x: 0, y: 0, type: 'base' },
            { x: 0, y: -20, type: 'chloroplast' },
            { x: 0, y: 20, type: 'chloroplast' },
            { x: -20, y: 0, type: 'chloroplast' },
            { x: 20, y: 0, type: 'chloroplast' },
            { x: 0, y: 35, type: 'thruster' } // Słaby napęd do dryfowania
        ]
    },

    sniper: {
        name: "Strzelec",
        aiType: "predator",
        blueprint: [
            { x: 0, y: 0, type: 'base' },
            { x: 0, y: -25, type: 'shooter' }, // Działko z przodu
            { x: 0, y: 25, type: 'storage' },  // Magazyn amunicji z tyłu
            { x: -20, y: 25, type: 'thruster' },
            { x: 20, y: 25, type: 'thruster' }
        ]
    }
};