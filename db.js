const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB: Połączono!'))
  .catch(err => console.error('❌ MongoDB: Błąd połączenia:', err));

const Schema = mongoose.Schema;

// Schemat Rankingu
const scoreSchema = new Schema({
    name: { type: String, required: true, index: true },
    score: { type: Number, required: true },
    blueprint: { type: Schema.Types.Mixed, required: true },
    date: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);

async function saveHighScore(name, score, blueprint) {
    if (!name || score <= 0) return;
    try {
        await Score.findOneAndUpdate(
            { name: name, score: { $lt: score } },
            { $set: { score: score, blueprint: blueprint, date: Date.now() } },
            { upsert: true }
        );
        console.log(`[DB] Zapisano rekord: ${name} (${score} ATP)`);
    } catch (err) {
        console.error("❌ Błąd zapisu rankingu:", err.message);
    }
}

async function getTopScores() {
    try {
        // DODANO .lean() - zapobiega błędom 500 na serwerze!
        return await Score.find().sort({ score: -1 }).limit(5).select('name score blueprint date').lean();
    } catch (err) {
        return [];
    }
}

// Schemat Cmentarza
const graveSchema = new Schema({
    name: String,
    score: Number,
    blueprint: Schema.Types.Mixed,
    causeOfDeath: String,
    date: { type: Date, default: Date.now }
});

const Grave = mongoose.model('Grave', graveSchema);

// ... (wcześniejsza część db.js, schematy itp.)

// Funkcja zapisu na cmentarz (wywoływana przy każdej śmierci)
async function buryOrganism(name, score, blueprint) {
    // Łagodniejsza walidacja: pozwalamy na pochówek nawet z wynikiem 0
    if (!name) {
        console.warn("⚠️ Próba pochówku organizmu bez nazwy - zignorowano.");
        return;
    }

    try {
        const deceased = new Grave({
            name: name,
            score: score || 0, // Zabezpieczenie
            blueprint: blueprint
        });

        await deceased.save(); // Tworzy NOWY dokument w bazie za każdym razem
        console.log(`[🪦 Cmentarz] Wyryto wspomnienie: ${name} (${score} ATP)`);
    } catch (err) {
        console.error("❌ Błąd podczas tworzenia Raportu Wspomnień:", err.message);
    }
}

// Pobieranie ostatnich zgonów dla modala
async function getRecentGraves(limit = 15) {
    try {
        return await Grave.find()
            .sort({ date: -1 }) // -1 = od najnowszych
            .limit(limit)
            .lean(); // .lean() zapobiega błędom pamięci "500 Internal Server Error"
    } catch (err) {
        console.error("❌ Błąd odczytu ksiąg cmentarnych:", err.message);
        return [];
    }
}

// KRYTYCZNE: Pamiętaj o wyeksportowaniu nowej funkcji!
module.exports = {
    saveHighScore,
    getTopScores,
    buryOrganism,
    getRecentGraves
};