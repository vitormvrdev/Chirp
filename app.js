const path = require('path');
const express = require('express');
const app = express(); 
const connectDB = require('./config/connection');
const session = require('express-session');
const registerRoute = require('./src/routes/registerRoutes');
const loginRoute = require('./src/routes/loginRoutes');
const apiRoutes = require('./src/routes/api/posts'); // Vamos usar isto para os posts já a seguir
const profileRoute = require('./src/routes/profileRoutes');
const notificationRoute = require('./src/routes/notificationRoutes');
require('dotenv').config();

// 1. Conectar à Base de Dados
connectDB();

// 2. Configurações Básicas
app.set('view engine', 'pug'); 
app.set('views', path.join(__dirname, 'src/views')); 

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// 3. Configuração da Sessão
app.use(session({
    secret: "chirp_segredo_batata",
    resave: true,
    saveUninitialized: false
}));

// --- MIDDLEWARE DE LOGIN ---
const requireLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/login');
    }
};

// --- ROTAS DE AUTENTICAÇÃO ---
app.use('/register', registerRoute);
app.use('/login', loginRoute);

// --- ROTAS DA BARRA LATERAL (Para navegação funcionar) ---
app.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(() => {
            res.redirect('/login');
        });
    } else {
        res.redirect('/login');
    }
});

// Rotas Placeholder (para não dar erro ao clicar)
app.get('/search', requireLogin, (req, res) => {
    const payload = { pageTitle: "Explorar", userLoggedIn: req.session.user };
    res.render('feed', payload);
});

app.use('/profile', requireLogin, profileRoute);

app.use('/notifications', requireLogin, notificationRoute);

// --- ROTA PRINCIPAL (FEED) ---
app.get('/', requireLogin, (req, res) => {
    const payload = {
        pageTitle: 'Home',
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user) // Útil para o JS saber quem és
    };
    res.render('feed', payload);
});

// --- API (Para criar e buscar posts) ---
// Isto vai permitir buscar os posts de toda a gente
app.use('/api/posts', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor a rodar na porta ${PORT}`));