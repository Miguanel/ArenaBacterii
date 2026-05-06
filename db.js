const mongoose = require('mongoose');

// Render automatycznie wstrzykuje zmienne, więc .config() nie jest zawsze konieczne,
// ale warto mieć pancerne połączenie.
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB: Połączono!'))
  .catch(err => console.error('❌ MongoDB: Błąd połączenia:', err));

const scoreSchema = new mongoose.Schema({
    // Usuwamy 'unique: true' z name, by uniknąć błędów przy duplikacji,
    // lepiej zarządzać tym przez findOneAndUpdate.
    name: { type: String, required: true, index: true },
    score: { type: Number, required: true },
    blueprint: { type: Schema.Types.Mixed, required: true },
    date: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);

async function saveHighScore(name, score, blueprint) {
    if (!name || score <= 0) return;

    try {
        // Używamy atomicznej operacji: znajdź gracza i zaktualizuj go TYLKO jeśli ma lepszy wynik.
        // Jeśli nie istnieje (upsert) – stwórz nowego.
        await Score.findOneAndUpdate(
            { name: name, score: { $lt: score } }, // Szukaj tego gracza z mniejszym wynikiem
            {
                $set: {
                    score: score,
                    blueprint: blueprint,
                    date: Date.now()
                }
            },
            { upsert: true } // Jeśli nie znajdzie (nowy gracz), stwórz wpis
        );
        console.log(`[DB] Próba zapisu dla: ${name} (${score} ATP) zakończona sukcesem.`);
    } catch (err) {
        // Jeśli błąd dotyczy duplikatu klucza (przez stare unique:true), po prostu go zalogujemy.
        console.error("❌ Błąd zapisu rankingu:", err.message);
    }
}

async function getTopScores() {
    try {
        return await Score.find().sort({ score: -1 }).limit(5).select('name score date');
    } catch (err) {
        return [];
    }
}

module.exports = { saveHighScore, getTopScores };