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

async function getRecentGraves(limit = 10) {
    try {
        // DODANO .lean() - kluczowe dla Cmentarza!
        return await Grave.find().sort({ date: -1 }).limit(limit).lean();
    } catch (err) {
        console.error("❌ Błąd pobierania cmentarza:", err);
        return [];
    }
}

module.exports = { saveHighScore, getTopScores, buryOrganism, getRecentGraves };