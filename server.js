require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const gameEngine = require('./gameEngine');
const { getTopScores, getRecentGraves } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Endpoint dla Hall of Fame
app.get('/api/leaderboard', async (req, res) => {
    const { getTopScores } = require('./db');
    const scores = await getTopScores();
    res.json(scores);
});

// Endpoint dla Cmentarza (Raporty Wspomnień)
app.get('/api/graveyard', async (req, res) => {
    try {
        const { getRecentGraves } = require('./db');
        const graves = await getRecentGraves(20); // Pobieramy 20 ostatnich wspomnień
        res.json(graves);
    } catch (error) {
        console.error("Błąd API Cmentarza:", error);
        res.status(500).json({ error: "Nie udało się połączyć z bazą Cmentarza" });
    }
});

gameEngine.init(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Serwer nasłuchuje na porcie ${PORT}`));