require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const gameEngine = require('./gameEngine');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

app.get('/api/leaderboard', async (req, res) => {
    try {
        const scores = await db.getTopScores();
        res.json(scores || []);
    } catch (e) {
        res.json([]);
    }
});

app.get('/api/graveyard', async (req, res) => {
    try {
        const graves = await db.getRecentGraves(20);
        res.json(graves || []);
    } catch (e) {
        res.json([]);
    }
});

// Uruchamiamy silnik gry
gameEngine.init(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Serwer nasłuchuje na porcie ${PORT}`));