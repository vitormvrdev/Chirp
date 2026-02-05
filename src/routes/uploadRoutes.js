const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/sqlite/User');

const uploadsDir = path.join(__dirname, '../..', 'uploads');
const profilePicsDir = path.join(uploadsDir, 'profile');
const postImagesDir = path.join(uploadsDir, 'posts');

[uploadsDir, profilePicsDir, postImagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = req.uploadType === 'profile' ? profilePicsDir : postImagesDir;
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${req.session.user._id}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de ficheiro não suportado.'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const setUploadType = (type) => (req, res, next) => {
    req.uploadType = type;
    next();
};

router.post('/profile', setUploadType('profile'), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhuma imagem enviada.' });
        }

        const imageUrl = `/uploads/profile/${req.file.filename}`;

        const user = User.findByIdAndUpdate(req.session.user._id, { profilePic: imageUrl });

        req.session.user = { ...req.session.user, profilePic: imageUrl };

        res.json({ success: true, imageUrl, message: 'Foto de perfil atualizada.' });

    } catch (error) {
        console.error('Profile upload error:', error);
        res.status(500).json({ message: 'Erro ao fazer upload.' });
    }
});

router.post('/post', setUploadType('post'), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhuma imagem enviada.' });
        }

        const imageUrl = `/uploads/posts/${req.file.filename}`;

        res.json({ success: true, imageUrl, message: 'Imagem carregada.' });

    } catch (error) {
        console.error('Post image upload error:', error);
        res.status(500).json({ message: 'Erro ao fazer upload.' });
    }
});

router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'Ficheiro demasiado grande. Máximo 5MB.' });
        }
        return res.status(400).json({ message: error.message });
    }
    if (error) {
        return res.status(400).json({ message: error.message });
    }
    next();
});

module.exports = router;
