const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const morgan = require('morgan');

require('dotenv').config();

// Use SQLite instead of MongoDB
const { seedData } = require('./config/database');

// Route imports
const registerRoute = require('./src/routes/registerRoutes');
const loginRoute = require('./src/routes/loginRoutes');
const apiRoutes = require('./src/routes/api/posts');
const profileRoute = require('./src/routes/profileRoutes');
const notificationRoute = require('./src/routes/notificationRoutes');
const searchRoute = require('./src/routes/searchRoutes');
const followRoute = require('./src/routes/followRoutes');
const uploadRoute = require('./src/routes/uploadRoutes');

// Error handler
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

// 1. Initialize SQLite Database with seed data
if (process.env.NODE_ENV !== 'test') {
    seedData().catch(console.error);
}

// 2. Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://code.jquery.com", "https://cdn.tailwindcss.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:"],
        },
    },
}));

// Rate limiting (disabled in test mode)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'test' ? 0 : 100, // 0 = disabled
    message: { message: 'Demasiadas tentativas, tente novamente mais tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 0 : 10, // 0 = disabled
    message: { message: 'Demasiadas tentativas de login, tente novamente mais tarde.' },
    skip: () => process.env.NODE_ENV === 'test',
});

if (process.env.NODE_ENV !== 'test') {
    app.use('/api', limiter);
}

// 3. Basic Configuration
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'src/views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging in development
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// 4. Session Configuration
if (!process.env.SESSION_SECRET) {
    console.warn('WARNING: SESSION_SECRET not set. Using default (insecure for production).');
}

app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// --- LOGIN MIDDLEWARE ---
const requireLogin = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/login');
    }
};

// Make user available to all templates
app.use((req, res, next) => {
    res.locals.userLoggedIn = req.session?.user || null;
    res.locals.userLoggedInJs = JSON.stringify(req.session?.user || null);
    next();
});

// --- AUTHENTICATION ROUTES ---
if (process.env.NODE_ENV === 'test') {
    app.use('/register', registerRoute);
    app.use('/login', loginRoute);
} else {
    app.use('/register', authLimiter, registerRoute);
    app.use('/login', authLimiter, loginRoute);
}

// --- LOGOUT ---
app.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(() => {
            res.redirect('/login');
        });
    } else {
        res.redirect('/login');
    }
});

// --- PROTECTED ROUTES ---
app.get('/search', requireLogin, searchRoute);
app.use('/profile', requireLogin, profileRoute);
app.use('/notifications', requireLogin, notificationRoute);
app.use('/api/follow', requireLogin, followRoute);
app.use('/api/upload', requireLogin, uploadRoute);

// --- HOME FEED ---
app.get('/', requireLogin, (req, res) => {
    res.render('feed', { pageTitle: 'Home' });
});

// --- API ROUTES ---
app.use('/api/posts', apiRoutes);

// --- 404 HANDLER ---
app.use((req, res, next) => {
    res.status(404).render('error', {
        pageTitle: 'Página não encontrada',
        message: 'A página que procuras não existe.',
        statusCode: 404
    });
});

// --- ERROR HANDLER ---
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`Servidor a rodar na porta ${PORT}`));
}

module.exports = app;
