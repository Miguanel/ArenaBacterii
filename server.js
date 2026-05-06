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

app.get('/api/leaderboard', async (req, res) => {
    const scores = await getTopScores();
    res.json(scores);
});

// Endpoint musi być skonfigurowany ZANIM odpalimy nasłuch!
app.get('/api/graveyard', async (req, res) => {
    const graves = await getRecentGraves(20);
    res.json(graves);
});

gameEngine.init(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Serwer nasłuchuje na porcie ${PORT}`));