const express = require('express');
const router = express.Router();
const User = require('../models/sqlite/User');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const loginValidation = [
    body('logUsername').trim().notEmpty().withMessage('Username ou email é obrigatório.'),
    body('logPassword').notEmpty().withMessage('Password é obrigatória.')
];

router.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { pageTitle: 'Entrar' });
});

router.post('/', loginValidation, async (req, res) => {
    const payload = { ...req.body, pageTitle: 'Entrar' };

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        payload.errorMessage = errors.array()[0].msg;
        return res.status(400).render('login', payload);
    }

    try {
        const { logUsername, logPassword } = req.body;

        const user = User.findOne({
            $or: [
                { userhandle: logUsername.toLowerCase() },
                { email: logUsername.toLowerCase() }
            ]
        });

        if (!user) {
            payload.errorMessage = 'Credenciais incorretas.';
            return res.status(401).render('login', payload);
        }

        const isMatch = await bcrypt.compare(logPassword, user.password);

        if (!isMatch) {
            payload.errorMessage = 'Credenciais incorretas.';
            return res.status(401).render('login', payload);
        }

        req.session.user = {
            _id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            userhandle: user.userhandle,
            email: user.email,
            profilePic: user.profilePic,
            likes: user.likes || [],
            following: user.following || [],
            followers: user.followers || []
        };

        return res.redirect('/');

    } catch (error) {
        console.error('Login error:', error);
        payload.errorMessage = 'Erro no servidor.';
        res.status(500).render('login', payload);
    }
});

module.exports = router;
