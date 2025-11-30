const express = require('express');
const app = express();
const connectDB = require('./config/database'); // O ficheiro que criaste agora
require('dotenv').config(); // <--- ISTO É ESSENCIAL

// Conectar à DB
connectDB();

// ... resto do código ...