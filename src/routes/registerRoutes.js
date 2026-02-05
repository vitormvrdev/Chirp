const express = require('express');
const router = express.Router();
const User = require('../models/sqlite/User');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const registerValidation = [
    body('firstName').trim().notEmpty().withMessage('Nome é obrigatório.').isLength({ min: 2, max: 50 }),
    body('lastName').trim().notEmpty().withMessage('Apelido é obrigatório.').isLength({ min: 2, max: 50 }),
    body('username').trim().notEmpty().withMessage('Username é obrigatório.').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
    body('email').trim().notEmpty().withMessage('Email é obrigatório.').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password é obrigatória.').isLength({ min: 6 }),
    body('passwordConf').notEmpty().custom((value, { req }) => {
        if (value !== req.body.password) throw new Error('As passwords não coincidem.');
        return true;
    })
];

router.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/');
    }
    res.render('register', { pageTitle: 'Registar' });
});

router.post('/', registerValidation, async (req, res) => {
    const { firstName, lastName, username, email, password } = req.body;
    const payload = { ...req.body, pageTitle: 'Registar' };

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        payload.errorMessage = errors.array()[0].msg;
        return res.status(400).render('register', payload);
    }

    try {
        const existingUser = User.findOne({
            $or: [
                { userhandle: username.toLowerCase() },
                { email: email.toLowerCase() }
            ]
        });

        if (existingUser) {
            payload.errorMessage = existingUser.email === email.toLowerCase() ? 'Email já está em uso.' : 'Username já está em uso.';
            return res.status(400).render('register', payload);
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            userhandle: username.toLowerCase().trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

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
        console.error('Registration error:', error);
        payload.errorMessage = 'Erro ao criar utilizador.';
        res.status(500).render('register', payload);
    }
});

module.exports = router;
