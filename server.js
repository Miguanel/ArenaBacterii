require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const gameEngine = require('./gameEngine');
const { getTopScores } = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// API do pobierania rankingu na stronę główną
app.get('/api/leaderboard', async (req, res) => {
    const scores = await getTopScores();
    res.json(scores);
});

// Uruchamiamy silnik gry
gameEngine.init(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Serwer nasłuchuje na porcie ${PORT}`));