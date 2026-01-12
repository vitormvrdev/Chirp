const path = require('path');
const express = require('express');
const app = express(); 
const connectDB = require('./config/connection');
require('dotenv').config();

// --- CONFIGURAÇÃO DA VIEW ENGINE (PUG) ---
app.set('view engine', 'pug'); 
app.set('views', path.join(__dirname, 'src/views')); 

app.use(express.static(path.join(__dirname, 'public')));

// Conectar à DB
connectDB();

// --- MIDDLEWARES ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Rota temporária só para testar o visual
app.get('/login', (req, res) => {
    res.render('login');
});

// --- ROTAS ---
const apiRoutes = require('./src/routes/api'); 
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor a rodar na porta ${PORT}`));