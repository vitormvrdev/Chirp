const express = require('express');
const router = express.Router();
const User = require('../models/sqlite/User');

router.get('/', (req, res) => {
    const user = req.session.user;
    if (user) {
        res.redirect(`/profile/${user.userhandle}`);
    } else {
        res.redirect('/login');
    }
});

router.get('/:username', async (req, res) => {
    try {
        const payload = getPayload(req.params.username, req.session.user);
        res.render('profile', payload);
    } catch (error) {
        console.error('Profile error:', error);
        res.render('profile', { pageTitle: 'Erro', profileUser: null, errorMessage: 'Erro ao carregar perfil.' });
    }
});

router.get('/:username/followers', async (req, res) => {
    try {
        const user = User.findOne({ userhandle: req.params.username });

        if (!user) {
            return res.render('followList', { pageTitle: 'Utilizador não encontrado', users: [], listType: 'followers', profileUser: null });
        }

        const followers = user.followers.map(id => User.findById(id)).filter(Boolean);

        res.render('followList', {
            pageTitle: `Seguidores de ${user.firstName}`,
            users: followers,
            listType: 'followers',
            profileUser: user
        });
    } catch (error) {
        console.error('Followers error:', error);
        res.status(500).render('error', { message: 'Erro ao carregar seguidores.' });
    }
});

router.get('/:username/following', async (req, res) => {
    try {
        const user = User.findOne({ userhandle: req.params.username });

        if (!user) {
            return res.render('followList', { pageTitle: 'Utilizador não encontrado', users: [], listType: 'following', profileUser: null });
        }

        const following = user.following.map(id => User.findById(id)).filter(Boolean);

        res.render('followList', {
            pageTitle: `${user.firstName} segue`,
            users: following,
            listType: 'following',
            profileUser: user
        });
    } catch (error) {
        console.error('Following error:', error);
        res.status(500).render('error', { message: 'Erro ao carregar lista.' });
    }
});

function getPayload(username, userLoggedIn) {
    let user = User.findOne({ userhandle: username.toLowerCase() });

    if (!user) {
        user = User.findById(username);
    }

    if (!user) {
        return { pageTitle: 'Utilizador não encontrado', profileUser: null };
    }

    const isFollowing = userLoggedIn.following?.includes(user.id);

    return {
        pageTitle: `${user.firstName} ${user.lastName}`,
        profileUser: user,
        isFollowing,
        isOwnProfile: userLoggedIn._id === user.id
    };
}

module.exports = router;
