const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth/authController');
const postController = require('../controllers/posts/postsController');

const { protect } = require('../middlewares/authMiddleware');

// Rotas Públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// --- ROTAS PROTEGIDAS (Só com Token) ---

router.get('/profile', protect, (req, res) => {
    
    res.json({
        message: "Estás na área VIP!",
        user: req.user
    });
});

// --- ROTAS DOS POSTS ---
// GET /api/posts -> Ver todos (Pode ser público ou protegido, tu decides. Vamos proteger para já)
router.get('/posts', protect, postController.getAllPosts);

// POST /api/posts/:id/retweet -> Criar ou Remover Retweet
router.post('/posts/:id/retweet', protect, postController.retweetPost);

// POST /api/posts -> Criar novo (OBRIGATÓRIO estar protegido para sabermos quem é o autor)
router.post('/posts', protect, postController.createPost);

// PUT /api/posts/:id/like -> Dar ou Remover Like
// Usamos PUT porque estamos a ATUALIZAR um recurso existente
router.put('/posts/:id/like', protect, postController.likePost);

// DELETE /api/posts/:id -> Apagar post (Protegido e verificado)
router.delete('/posts/:id', protect, postController.deletePost);

module.exports = router;