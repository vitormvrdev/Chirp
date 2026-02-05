const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Post = require('../../models/sqlite/Post');
const User = require('../../models/sqlite/User');
const Comment = require('../../models/sqlite/Comment');
const Notification = require('../../models/sqlite/Notification');

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    next();
};

// Validation rules
const postValidation = [
    body('content')
        .trim()
        .notEmpty().withMessage('O conteúdo do post é obrigatório.')
        .isLength({ max: 280 }).withMessage('O post não pode ter mais de 280 caracteres.')
];

const commentValidation = [
    body('content')
        .trim()
        .notEmpty().withMessage('O comentário é obrigatório.')
        .isLength({ max: 280 }).withMessage('O comentário não pode ter mais de 280 caracteres.')
];

// GET /api/posts - Get all posts with pagination
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const searchObj = {};
        if (req.query.postedBy) {
            searchObj.postedBy = req.query.postedBy;
        }

        const posts = await Post.find(searchObj).skip(skip).limit(limit);
        const total = Post.countDocuments(searchObj);

        res.status(200).json({
            posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        });

    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ message: 'Erro ao buscar posts.' });
    }
});

// POST /api/posts - Create a new post
router.post('/', requireAuth, postValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const postData = {
            content: req.body.content,
            postedBy: req.session.user._id
        };

        if (req.body.imageUrl) {
            postData.imageUrl = req.body.imageUrl;
        }

        const post = await Post.create(postData);
        res.status(201).json(post);

    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ message: 'Erro ao criar post.' });
    }
});

// GET /api/posts/:id - Get a single post
router.get('/:id', async (req, res) => {
    try {
        const post = Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado.' });
        }

        res.json(post);

    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ message: 'Erro ao buscar post.' });
    }
});

// DELETE /api/posts/:id - Delete a post
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const post = Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado.' });
        }

        if (post.postedBy._id !== req.session.user._id && post.postedBy.id !== req.session.user._id) {
            return res.status(403).json({ message: 'Não tens permissão para apagar este post.' });
        }

        Comment.deleteMany({ onPost: post.id });
        Post.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Post apagado com sucesso.' });

    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ message: 'Erro ao apagar post.' });
    }
});

// PUT /api/posts/:id/like - Like/Unlike a post
router.put('/:id/like', requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.session.user._id;

        // Check if already liked
        const user = User.findById(userId);
        const isLiked = user?.likes?.includes(postId);
        const option = isLiked ? '$pull' : '$addToSet';

        // Update user's likes
        const updatedUser = User.findByIdAndUpdate(userId, { [option]: { likes: postId } });
        req.session.user = updatedUser;

        // Update post's likes
        const post = Post.findByIdAndUpdate(postId, { [option]: { likes: userId } });

        // Create notification for new like
        if (!isLiked && post) {
            await Notification.insertNotification(post.postedBy._id || post.postedBy.id, userId, 'postLike', postId);
        }

        res.status(200).json(post);

    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ message: 'Erro ao processar o like.' });
    }
});

// POST /api/posts/:id/retweet - Retweet/Unretweet a post
router.post('/:id/retweet', requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.session.user._id;

        // Try to delete existing retweet
        const deletedPost = Post.findOneAndDelete({ postedBy: userId, retweetData: postId });

        const option = deletedPost ? '$pull' : '$addToSet';
        let repost = deletedPost;

        if (!repost) {
            repost = await Post.create({ postedBy: userId, retweetData: postId });

            const originalPost = Post.findById(postId);
            if (originalPost) {
                await Notification.insertNotification(originalPost.postedBy._id || originalPost.postedBy.id, userId, 'retweet', postId);
            }
        }

        // Update user's retweets
        const updatedUser = User.findByIdAndUpdate(userId, { [option]: { retweets: repost.id } });
        req.session.user = updatedUser;

        // Update original post's retweetUsers
        const post = Post.findByIdAndUpdate(postId, { [option]: { retweetUsers: userId } });

        res.status(200).json(post);

    } catch (error) {
        console.error('Retweet error:', error);
        res.status(500).json({ message: 'Erro ao processar retweet.' });
    }
});

// GET /api/posts/:id/comments - Get comments for a post
router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ onPost: req.params.id });
        res.json(comments);

    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Erro ao buscar comentários.' });
    }
});

// POST /api/posts/:id/comments - Add a comment
router.post('/:id/comments', requireAuth, commentValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const post = Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado.' });
        }

        const comment = await Comment.create({
            content: req.body.content,
            postedBy: req.session.user._id,
            onPost: req.params.id
        });

        const postAuthorId = post.postedBy._id || post.postedBy.id;
        if (postAuthorId !== req.session.user._id) {
            await Notification.insertNotification(postAuthorId, req.session.user._id, 'comment', post.id);
        }

        res.status(201).json(comment);

    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ message: 'Erro ao criar comentário.' });
    }
});

// DELETE /api/posts/comments/:commentId - Delete a comment
router.delete('/comments/:commentId', requireAuth, async (req, res) => {
    try {
        const comment = Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comentário não encontrado.' });
        }

        const commentAuthorId = comment.postedBy._id || comment.postedBy.id;
        if (commentAuthorId !== req.session.user._id) {
            return res.status(403).json({ message: 'Não tens permissão para apagar este comentário.' });
        }

        Comment.findByIdAndDelete(req.params.commentId);
        res.status(200).json({ message: 'Comentário apagado com sucesso.' });

    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Erro ao apagar comentário.' });
    }
});

module.exports = router;
