const express = require('express');
const router = express.Router(); // Só precisamos do Router, não da App inteira

const authController = require('../controllers/auth/authController'); 
const apiController = require('../controllers/apiController');

// --- Rotas ---
router.post('/register', authController.register);

module.exports = router;