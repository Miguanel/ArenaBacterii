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
    },
    leviathan: {
        name: "Lewiatan",
        aiType: "predator", // Bardzo agresywny i powolny niszczyciel
        blueprint: [
            // --- PRZÓD (PANCERNY TARAN I DZIAŁA) ---
            { x: 0, y: -40, type: 'spike' },      // Szpica główna
            { x: -20, y: -25, type: 'shooter' },  // Lewe działo
            { x: 20, y: -25, type: 'shooter' },   // Prawe działo
            { x: -15, y: -45, type: 'spike' },    // Szpica boczna
            { x: 15, y: -45, type: 'spike' },     // Szpica boczna

            // --- ŚRODEK (ZAAWANSOWANY RDZEŃ) ---
            { x: 0, y: 0, type: 'base' },         // Rdzeń główny
            { x: 0, y: -15, type: 'armor' },      // Ochrona czołowa rdzenia
            { x: -20, y: 0, type: 'armor' },      // Pancerz boczny
            { x: 20, y: 0, type: 'armor' },       // Pancerz boczny
            { x: -20, y: 15, type: 'armor' },     // Pancerz boczny - przedłużenie
            { x: 20, y: 15, type: 'armor' },      // Pancerz boczny - przedłużenie

            // --- SEKCJA ENERGETYCZNA ---
            { x: 0, y: 15, type: 'generator' },   // Główny reaktor
            { x: 0, y: 30, type: 'storage' },     // Magazyn energii/amunicji

            // --- TYŁ (ZESPOŁY NAPĘDOWE) ---
            { x: 0, y: 50, type: 'thruster' },    // Silnik główny
            { x: -25, y: 35, type: 'thruster' },  // Silnik manewrowy lewy
            { x: 25, y: 35, type: 'thruster' }    // Silnik manewrowy prawy
        ]
    },

    mantis: {
        name: "Modliszka",
        aiType: "predator", // Szybki łowca z "kleszczami"
        blueprint: [
            // --- KLESZCZE (DALEKIE ZASIĘGI) ---
            { x: -30, y: -40, type: 'spike' },    // Ostrze lewe
            { x: -20, y: -20, type: 'armor' },    // Ramię lewe
            { x: 30, y: -40, type: 'spike' },     // Ostrze prawe
            { x: 20, y: -20, type: 'armor' },     // Ramię prawe

            // --- MAŁY, SZYBKI RDZEŃ ---
            { x: 0, y: 0, type: 'base' },
            { x: 0, y: -15, type: 'generator' },  // Energia z przodu dla działka
            { x: 0, y: -30, type: 'shooter' },    // Działko między kleszczami

            // --- POTĘŻNY NAPĘD ---
            { x: 0, y: 20, type: 'thruster' },    // Główny dopalacz
            { x: -15, y: 15, type: 'thruster' },  // Boczny dopalacz
            { x: 15, y: 15, type: 'thruster' }    // Boczny dopalacz
        ]
    },

    hiveMother: {
        name: "Matka Roju",
        aiType: "roamer", // Gigantyczna, spokojna twierdza
        blueprint: [
            // --- POTĘŻNA WARSTWA OCHRONNA ---
            { x: 0, y: -30, type: 'armor' },
            { x: -20, y: -25, type: 'armor' },
            { x: 20, y: -25, type: 'armor' },
            { x: -35, y: -10, type: 'armor' },
            { x: 35, y: -10, type: 'armor' },
            { x: -35, y: 10, type: 'armor' },
            { x: 35, y: 10, type: 'armor' },

            // --- ŚRODEK (PRODUKCJA I ZASOBY) ---
            { x: 0, y: 0, type: 'base' },
            { x: -15, y: 0, type: 'storage' },    // Magazyn L
            { x: 15, y: 0, type: 'storage' },     // Magazyn P
            { x: 0, y: -15, type: 'generator' },  // Reaktor 1
            { x: 0, y: 15, type: 'generator' },   // Reaktor 2

            // --- SYSTEMY PASYWNE ---
            { x: -20, y: 25, type: 'chloroplast' }, // Pasywne odnawianie
            { x: 20, y: 25, type: 'chloroplast' },

            // --- OBRONA TYŁU I SŁABY NAPĘD ---
            { x: 0, y: 30, type: 'shooter' },     // Działko strzelające do tyłu (obrona)
            { x: 0, y: 45, type: 'thruster' }     // Bardzo słaby napęd ze względu na masę
        ]
    },

    worldTree: {
        name: "Drzewo Życia",
        aiType: "plant", // Rozłożysta struktura szukająca światła
        blueprint: [
            // --- RDZEŃ I PIEŃ ---
            { x: 0, y: 0, type: 'base' },
            { x: 0, y: 15, type: 'storage' },
            { x: 0, y: 30, type: 'storage' },

            // --- GAŁĘZIE / LIŚCIE (CHLOROPLASTY) ---
            // Główna korona
            { x: 0, y: -20, type: 'chloroplast' },
            { x: 0, y: -40, type: 'chloroplast' },

            // Lewa strona
            { x: -20, y: -15, type: 'chloroplast' },
            { x: -40, y: -25, type: 'chloroplast' },
            { x: -25, y: 5, type: 'chloroplast' },

            // Prawa strona
            { x: 20, y: -15, type: 'chloroplast' },
            { x: 40, y: -25, type: 'chloroplast' },
            { x: 25, y: 5, type: 'chloroplast' },

            // --- KORZENIE (NAPĘD) ---
            { x: -10, y: 45, type: 'thruster' },  // Lekkie znoszenie
            { x: 10, y: 45, type: 'thruster' }    // Lekkie znoszenie
        ]
    }
};