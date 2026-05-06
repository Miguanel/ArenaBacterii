const mongoose = require('mongoose');

// Render automatycznie wstrzykuje zmienne, więc .config() nie jest zawsze konieczne,
// ale warto mieć pancerne połączenie.
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB: Połączono!'))
  .catch(err => console.error('❌ MongoDB: Błąd połączenia:', err));

// ROZWIĄZANIE: Definiujemy Schema, aby JavaScript wiedział co to jest
const Schema = mongoose.Schema;

const scoreSchema = new Schema({
    name: { type: String, required: true, index: true },
    score: { type: Number, required: true },
    // Używamy Mixed, aby baza była elastyczna dla danych z Unity i WWW
    blueprint: { type: Schema.Types.Mixed, required: true },
    date: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);

async function saveHighScore(name, score, blueprint) {
    if (!name || score <= 0) return;

    try {
        // Atomiczna aktualizacja - zapisz tylko jeśli wynik jest lepszy
        await Score.findOneAndUpdate(
            { name: name, score: { $lt: score } },
            {
                $set: {
                    score: score,
                    blueprint: blueprint,
                    date: Date.now()
                }
            },
            { upsert: true }
        );
        console.log(`[DB] Próba zapisu dla: ${name} (${score} ATP) zakończona sukcesem.`);
    } catch (err) {
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
// db.js - Dodaj nowy schemat i model
const graveSchema = new Schema({
    name: String,
    score: Number,
    blueprint: Schema.Types.Mixed,
    causeOfDeath: String, // Opcjonalnie: np. 'virus', 'starvation', 'spike'
    date: { type: Date, default: Date.now }
});

const Grave = mongoose.model('Grave', graveSchema);

// Funkcja zapisu na cmentarz (wywoływana przy każdej śmierci)
async function buryOrganism(name, score, blueprint) {
    if (!name || score <= 0) return;
    try {
        const deceased = new Grave({ name, score, blueprint });
        await deceased.save();
        console.log(`[Cmentarz] Pochowano: ${name}`);
    } catch (err) {
        console.error("❌ Błąd pochówku:", err);
    }
}

// Pobieranie ostatnich zgonów
async function getRecentGraves(limit = 10) {
    return await Grave.find().sort({ date: -1 }).limit(limit);
}

// Pamiętaj o eksporcie!
module.exports = { saveHighScore, getTopScores, buryOrganism, getRecentGraves };
