const mongoose = require('mongoose');

// Wyłączamy nieskończone oczekiwanie na bazę danych!
mongoose.set('bufferCommands', false);

let isDbConnected = false;

if (!process.env.MONGODB_URI) {
    console.error("❌ BRAK ZMIENNEJ MONGODB_URI! Baza danych nie zadziała.");
} else {
    mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000 // Max 5 sekund na połączenie
    })
    .then(() => {
        console.log('✅ MongoDB: Połączono pomyślnie!');
        isDbConnected = true;
    })
    .catch(err => console.error('❌ MongoDB: Błąd połączenia (sprawdź IP w Atlas):', err.message));
}

const Schema = mongoose.Schema;

// --- SCHEMAT RANKINGU ---
const scoreSchema = new Schema({
    name: { type: String, required: true, index: true },
    score: { type: Number, required: true },
    blueprint: { type: Schema.Types.Mixed, required: true },
    date: { type: Date, default: Date.now }
});

// Zabezpieczenie przed nadpisywaniem modeli
const Score = mongoose.models.Score || mongoose.model('Score', scoreSchema);

async function saveHighScore(name, score, blueprint) {
    if (!isDbConnected || !name || score <= 0) return;
    try {
        await Score.findOneAndUpdate(
            { name: name, score: { $lt: score } },
            { $set: { score: score, blueprint: blueprint, date: Date.now() } },
            { upsert: true, maxTimeMS: 2000 } // Przerywa po 2 sekundach
        );
        console.log(`[DB] Zapisano rekord życiowy: ${name}`);
    } catch (err) {
        console.error("❌ Błąd zapisu rankingu:", err.message);
    }
}

async function getTopScores() {
    if (!isDbConnected) return [];
    try {
        return await Score.find().sort({ score: -1 }).limit(5).select('name score blueprint date').lean().maxTimeMS(2000);
    } catch (err) {
        console.error("❌ Błąd pobierania rankingu:", err.message);
        return [];
    }
}

// --- SCHEMAT CMENTARZA ---
const graveSchema = new Schema({
    name: String,
    score: Number,
    blueprint: Schema.Types.Mixed,
    causeOfDeath: String,
    date: { type: Date, default: Date.now }
});

const Grave = mongoose.models.Grave || mongoose.model('Grave', graveSchema);

async function buryOrganism(name, score, blueprint) {
    if (!isDbConnected || !name) return;
    try {
        const deceased = new Grave({ name, score: score || 0, blueprint });
        await deceased.save();
        console.log(`[🪦 Cmentarz] Wyryto wspomnienie: ${name}`);
    } catch (err) {
        console.error("❌ Błąd pochówku:", err.message);
    }
}

async function getRecentGraves(limit = 15) {
    if (!isDbConnected) return [];
    try {
        return await Grave.find().sort({ date: -1 }).limit(limit).lean().maxTimeMS(2000);
    } catch (err) {
        console.error("❌ Błąd odczytu cmentarza:", err.message);
        return [];
    }
}

module.exports = { saveHighScore, getTopScores, buryOrganism, getRecentGraves };