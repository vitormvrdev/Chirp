const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/authController');
const postController = require('../controllers/posts/postsController');

// Importar o Middleware (O Segurança)
const { protect } = require('../middlewares/authMiddleware'); // <--- AQUI

// Rotas Públicas (Qualquer um entra)
router.post('/register', authController.register);
router.post('/login', authController.login);

// --- ROTAS PROTEGIDAS (Só com Token) ---

// Exemplo: Uma rota que só devolve "Olá" se tiveres logado
// O 'protect' fica entre o endereço e a função final
router.get('/profile', protect, (req, res) => {
    // Como o middleware correu antes, nós temos acesso ao user!
    res.json({
        message: "Estás na área VIP!",
        user: req.user // <--- MAGIA: O middleware pôs isto aqui
    });
});

// --- ROTAS DOS POSTS ---
// GET /api/posts -> Ver todos (Pode ser público ou protegido, tu decides. Vamos proteger para já)
router.get('/posts', protect, postController.getAllPosts);

// POST /api/posts -> Criar novo (OBRIGATÓRIO estar protegido para sabermos quem é o autor)
router.post('/posts', protect, postController.createPost);

// PUT /api/posts/:id/like -> Dar ou Remover Like
// Usamos PUT porque estamos a ATUALIZAR um recurso existente
router.put('/posts/:id/like', protect, postController.likePost);

module.exports = router;