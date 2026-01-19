const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Confirma se o caminho para o teu model está certo
const bcrypt = require('bcrypt');

// GET /register -> Mostrar o formulário
router.get('/', (req, res) => {
    res.render('register');
});

// POST /register -> Receber os dados do formulário
// src/routes/registerRoutes.js

router.post('/', async (req, res) => {
    // O formulário continua a enviar 'username', por isso lemos 'username' aqui
    const { firstName, lastName, username, email, password, passwordConf } = req.body;

    const payload = req.body;

    if (firstName && lastName && username && email && password && passwordConf) {
        
        // 1. VERIFICAÇÃO:
        // Procuramos na DB se já existe alguém com este 'userhandle' (usando o valor do username)
        const user = await User.findOne({ 
            $or: [
                { userhandle: username }, // <--- MUDANÇA AQUI: Comparamos userhandle com o input username
                { email: email }
            ] 
        });

        if (user == null) {
            // User não existe, vamos criar!
            
            if (password !== passwordConf) {
                payload.errorMessage = "As passwords não coincidem.";
                return res.status(200).render("register", payload);
            }

            // Preparar os dados para guardar
            const data = req.body;
            data.password = await bcrypt.hash(password, 10);
            
            // --- A MUDANÇA IMPORTANTE ---
            // Criamos o campo 'userhandle' com o valor que veio do 'username'
            data.userhandle = username; 
            // ----------------------------

            User.create(data)
            .then((user) => {
                req.session.user = user; // Login automático (opcional)
                return res.redirect('/');
            })
            .catch((error) => {
                console.log(error);
                payload.errorMessage = "Erro ao criar utilizador.";
                res.status(200).render("register", payload);
            })

        } else {
            // Erro: Já existe
            if (email == user.email) {
                payload.errorMessage = "Email já está em uso.";
            } else {
                payload.errorMessage = "Username (Handle) já está em uso.";
            }
            res.status(200).render("register", payload);
        }

    } else {
        payload.errorMessage = "Preenche todos os campos.";
        res.status(200).render("register", payload);
    }
});

module.exports = router;