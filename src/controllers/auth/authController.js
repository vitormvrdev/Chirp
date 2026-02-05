const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult, body } = require('express-validator');

// Validation rules
exports.registerValidation = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('Nome é obrigatório.')
        .isLength({ min: 2, max: 50 }).withMessage('Nome deve ter entre 2 e 50 caracteres.')
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/).withMessage('Nome só pode conter letras.'),
    body('lastName')
        .trim()
        .notEmpty().withMessage('Apelido é obrigatório.')
        .isLength({ min: 2, max: 50 }).withMessage('Apelido deve ter entre 2 e 50 caracteres.')
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/).withMessage('Apelido só pode conter letras.'),
    body('userhandle')
        .trim()
        .notEmpty().withMessage('Username é obrigatório.')
        .isLength({ min: 3, max: 20 }).withMessage('Username deve ter entre 3 e 20 caracteres.')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username só pode conter letras, números e underscore.')
        .toLowerCase(),
    body('email')
        .trim()
        .notEmpty().withMessage('Email é obrigatório.')
        .isEmail().withMessage('Email inválido.')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password é obrigatória.')
        .isLength({ min: 6 }).withMessage('Password deve ter pelo menos 6 caracteres.')
];

exports.loginValidation = [
    body('loginData')
        .trim()
        .notEmpty().withMessage('Username ou email é obrigatório.'),
    body('password')
        .notEmpty().withMessage('Password é obrigatória.')
];

exports.register = async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const { firstName, lastName, userhandle, email, password } = req.body;

    try {
        // Check if user already exists
        const userExists = await User.findOne({
            $or: [{ email: email }, { userhandle: userhandle }]
        });

        if (userExists) {
            const field = userExists.email === email ? 'Email' : 'Username';
            return res.status(400).json({ message: `${field} já registado.` });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            userhandle,
            email,
            password: hashedPassword
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, userhandle: user.userhandle },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                userhandle: user.userhandle,
                email: user.email,
                profilePic: user.profilePic
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Erro ao registar utilizador.' });
    }
};

exports.login = async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const { loginData, password } = req.body;

    try {
        // Find user by email or userhandle
        const user = await User.findOne({
            $or: [{ email: loginData.toLowerCase() }, { userhandle: loginData.toLowerCase() }]
        });

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, userhandle: user.userhandle },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                userhandle: user.userhandle,
                profilePic: user.profilePic,
                likes: user.likes,
                following: user.following,
                followers: user.followers
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Erro no servidor ao fazer login.' });
    }
};
