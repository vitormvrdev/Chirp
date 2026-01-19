const path = require('path');
const express = require('express');
const app = express(); 
const connectDB = require('./config/connection');
const session = require('express-session'); // <--- NOVO
const registerRoute = require('./src/routes/registerRoutes');
const loginRoute = require('./src/routes/loginRoutes'); // <--- NOVO
const apiRoutes = require('./src/routes/api');
require('dotenv').config();

connectDB();

app.set('view engine', 'pug'); 
app.set('views', path.join(__dirname, 'src/views')); 

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURAÇÃO DA SESSÃO ---
app.use(session({
    secret: "chirp_segredo_batata", // Podes mudar isto para algo aleatório
    resave: true,
    saveUninitialized: false
}));

// --- ROTAS ---
app.use('/register', registerRoute);
app.use('/login', loginRoute); // <--- AGORA USA O FICHEIRO LOGINROUTES

// Middleware de Login (Agora verifica a sessão!)
const requireLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/login');
    }
};

// Rota Principal (Protegida)
app.get('/', requireLogin, (req, res) => {
    const payload = {
        pageTitle: 'Home',
        userLoggedIn: req.session.user, // Passamos o user logado para a view
    };
    res.render('feed', payload);
});

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor a rodar na porta ${PORT}`));