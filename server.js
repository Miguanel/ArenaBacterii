require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const gameEngine = require('./gameEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/bakteriofagocyty")
  .then(() => console.log('🧬 MongoDB Połączone'))
  .catch((err) => console.error('Błąd MongoDB:', err));

// Uruchamiamy silnik gry
gameEngine.init(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Serwer nasłuchuje na porcie ${PORT}`));