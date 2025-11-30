const express = require('express');
const app = express(); 
const connectDB = require('./config/connection');
require('dotenv').config();

// Conectar à DB
connectDB();

// --- MIDDLEWARES ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- ROTAS ---
const apiRoutes = require('./src/routes/api'); 
app.use('/api', apiRoutes); // O pedido passa pelos middlewares acima antes de chegar aqui

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor a rodar na porta ${PORT}`));