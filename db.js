const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Połączono z MongoDB - Globalny Ranking aktywny!'))
  .catch(err => console.error('Błąd połączenia z bazą:', err));

const scoreSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    score: { type: Number, required: true },
    // Zmiana na [Object] daje pewność, że Mongoose zapisze wszystko, co jest w obiektach {x, y, type}
    blueprint: { type: [Object], required: true },
    date: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);

async function saveHighScore(name, score, blueprint) {
    // ZMIANA: Obniżamy próg do zera na czas testów.
    // Zapisze każdego, kto wejdzie do gry i zdobędzie cokolwiek (lub umrze z bazowym 200).
    if (score <= 0) return;

    try {
        const existing = await Score.findOne({ name: name });

        if (!existing || score > existing.score || !existing.blueprint || existing.blueprint.length === 0) {

            const finalScore = (existing && existing.score > score) ? existing.score : score;

            await Score.findOneAndUpdate(
                { name: name },
                { score: finalScore, blueprint: blueprint, date: Date.now() },
                { upsert: true, returnDocument: 'after' }
            );
            console.log(`[DB] Zapisano wynik dla: ${name} (${finalScore} ATP)`); // Log w konsoli, żebyś widział, że działa
        }
    } catch (err) {
        console.error("Błąd zapisu rankingu:", err);
    }
}

async function getTopScores() {
    try {
        return await Score.find().sort({ score: -1 }).limit(5);
    } catch (err) {
        return [];
    }
}

module.exports = { saveHighScore, getTopScores };