const path = require('path');
const express = require('express');
const app = express(); 
const connectDB = require('./config/connection');
require('dotenv').config();

// --- CONFIGURAÇÃO DA VIEW ENGINE (PUG) ---
app.set('view engine', 'pug'); // Dizemos ao Express: "Usa o Pug para desenhar o HTML"
app.set('views', path.join(__dirname, 'src/views')); // Dizemos: "Os ficheiros visuais vão estar na pasta 'views'"

// --- FICHEIROS ESTÁTICOS (CSS, Imagens, JS do frontend) ---
// Tudo o que estiver na pasta "public" fica acessível no navegador
app.use(express.static(path.join(__dirname, 'public')));

// Conectar à DB
connectDB();

// --- MIDDLEWARES ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Rota temporária só para testar o visual
app.get('/login', (req, res) => {
    // Isto vai procurar o ficheiro 'login.pug' na pasta views e renderizá-lo
    res.render('login');
});

// --- ROTAS ---
const apiRoutes = require('./src/routes/api'); 
app.use('/api', apiRoutes); // O pedido passa pelos middlewares acima antes de chegar aqui

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor a rodar na porta ${PORT}`));