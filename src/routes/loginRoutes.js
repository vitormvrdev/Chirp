const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
    res.render('login');
});

router.post('/', async (req, res) => {
    const payload = req.body;
    
    // Os nomes dos campos vêm do teu login.pug (logUsername, logPassword)
    if(req.body.logUsername && req.body.logPassword) {
        
        // Procurar utilizador pelo userhandle OU email
        const user = await User.findOne({
            $or: [
                { userhandle: req.body.logUsername },
                { email: req.body.logUsername }
            ]
        });

        if(user != null) {
            // Verificar a password
            const result = await bcrypt.compare(req.body.logPassword, user.password);

            if(result === true) {
                // SUCESSO!
                req.session.user = user; // Guarda o user na sessão
                return res.redirect('/');
            }
        }
        
        // Se falhar (user não encontrado ou password errada)
        payload.errorMessage = "Credenciais incorretas.";
        return res.status(200).render("login", payload);
    }

    payload.errorMessage = "Preenche todos os campos.";
    res.status(200).render("login", payload);
});

module.exports = router;