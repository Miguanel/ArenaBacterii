const mongoose = require('mongoose');

// Zapobiegamy blokowaniu serwera
mongoose.set('bufferCommands', false);
let isDbConnected = false;

// Pamięć RAM (Tymczasowa kopia na wypadek problemów z netem)
let localGraveyard = [];
let localLeaderboard = [];

if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
    .then(() => {
        console.log('✅ MongoDB: Połączono pomyślnie!');
        isDbConnected = true;
    })
    .catch(err => {
        console.error('❌ MongoDB: Błąd zapory/IP. Przełączam na pamięć RAM serwera!');
    });
}

const Schema = mongoose.Schema;

// --- SCHEMAT RANKINGU ---
const scoreSchema = new Schema({
    name: { type: String, unique: true },
    score: Number,
    blueprint: Schema.Types.Mixed,
    date: { type: Date, default: Date.now }
});
const Score = mongoose.models.Score || mongoose.model('Score', scoreSchema);

// --- SCHEMAT CMENTARZA ---
const graveSchema = new Schema({
    name: String,
    score: Number,
    blueprint: Schema.Types.Mixed,
    date: { type: Date, default: Date.now }
});
const Grave = mongoose.models.Grave || mongoose.model('Grave', graveSchema);


// --- FUNKCJE BAZY DANYCH ---

async function saveHighScore(name, score, blueprint) {
    if (!name || score <= 0) return;

    // Zapis do lokalnego RAM (Zabezpieczenie przed dublowaniem)
    const localIdx = localLeaderboard.findIndex(p => p.name === name);
    if (localIdx !== -1) {
        if (score > localLeaderboard[localIdx].score) {
            localLeaderboard[localIdx] = { name, score, blueprint, date: new Date() };
        }
    } else {
        localLeaderboard.push({ name, score, blueprint, date: new Date() });
    }
    localLeaderboard.sort((a, b) => b.score - a.score);
    if (localLeaderboard.length > 5) localLeaderboard.pop();

    // Zapis do MongoDB
    if (!isDbConnected) return;
    try {
        const existing = await Score.findOne({ name });
        if (existing) {
            if (score > existing.score) {
                await Score.updateOne(
                    { name: name },
                    { $set: { score: score, blueprint: blueprint, date: Date.now() } }
                );
                console.log(`[🏆 Hall of Fame] Pobito rekord: ${name} (${score} ATP)`);
            }
        } else {
            await Score.create({ name, score, blueprint });
            console.log(`[🏆 Hall of Fame] Nowy szczep w rankingu: ${name} (${score} ATP)`);
        }
    } catch (err) {
        console.error("❌ Błąd zapisu rankingu:", err.message);
    }
}

async function getTopScores() {
    if (!isDbConnected) return localLeaderboard;
    try {
        return await Score.find().sort({ score: -1 }).limit(5).select('name score blueprint date').lean().maxTimeMS(2000);
    } catch (err) {
        return localLeaderboard;
    }
}

async function buryOrganism(name, score, blueprint) {
    if (!name) return;

    localGraveyard.unshift({ name, score, blueprint, date: new Date() });
    if (localGraveyard.length > 20) localGraveyard.pop();

    if (!isDbConnected) return;
    try {
        const deceased = new Grave({ name, score: score || 0, blueprint });
        await deceased.save();
        console.log(`[🪦 Cmentarz] Wyryto wspomnienie: ${name}`);
    } catch (err) {
        console.error("❌ Błąd pochówku:", err.message);
    }
}

async function getRecentGraves(limit = 15) {
    if (!isDbConnected) return localGraveyard.slice(0, limit);
    try {
        return await Grave.find().sort({ date: -1 }).limit(limit).lean().maxTimeMS(2000);
    } catch (err) {
        return localGraveyard.slice(0, limit);
    }
}

module.exports = { saveHighScore, getTopScores, buryOrganism, getRecentGraves };