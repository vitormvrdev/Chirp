const express = require('express');
const router = express.Router();
const User = require('../models/sqlite/User');
const Post = require('../models/sqlite/Post');

router.get('/', async (req, res) => {
    const query = req.query.q || '';
    let users = [];
    let posts = [];

    if (query.trim()) {
        users = User.find({
            $or: [
                { firstName: { $regex: query } },
                { lastName: { $regex: query } },
                { userhandle: { $regex: query } }
            ]
        }).slice(0, 10);

        posts = await Post.find({ content: { $regex: query } }).limit(20);
    }

    res.render('search', {
        pageTitle: query ? `Pesquisa: ${query}` : 'Explorar',
        query,
        users,
        posts,
        userLoggedInJs: JSON.stringify(req.session.user)
    });
});

router.get('/api', async (req, res) => {
    const query = req.query.q || '';

    if (!query.trim()) {
        return res.json({ users: [], posts: [] });
    }

    const users = User.find({
        $or: [
            { firstName: { $regex: query } },
            { lastName: { $regex: query } },
            { userhandle: { $regex: query } }
        ]
    }).slice(0, 5);

    const posts = await Post.find({ content: { $regex: query } }).limit(5);

    res.json({ users, posts });
});

module.exports = router;
