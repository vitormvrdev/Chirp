const express = require('express');
const router = express.Router();
const User = require('../models/sqlite/User');
const Notification = require('../models/sqlite/Notification');

router.put('/:userId', async (req, res) => {
    try {
        const userToFollowId = req.params.userId;
        const currentUserId = req.session.user._id;

        if (userToFollowId === currentUserId) {
            return res.status(400).json({ message: 'Não podes seguir-te a ti mesmo.' });
        }

        const userToFollow = User.findById(userToFollowId);
        if (!userToFollow) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        const isFollowing = req.session.user.following?.includes(userToFollowId);
        const option = isFollowing ? '$pull' : '$addToSet';

        const updatedCurrentUser = User.findByIdAndUpdate(currentUserId, { [option]: { following: userToFollowId } });

        User.findByIdAndUpdate(userToFollowId, { [option]: { followers: currentUserId } });

        req.session.user = {
            ...req.session.user,
            following: updatedCurrentUser.following
        };

        if (!isFollowing) {
            await Notification.insertNotification(userToFollowId, currentUserId, 'follow', currentUserId);
        }

        const updatedUserToFollow = User.findById(userToFollowId);

        res.status(200).json({
            success: true,
            isFollowing: !isFollowing,
            followersCount: updatedUserToFollow.followers.length
        });

    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ message: 'Erro ao processar o pedido.' });
    }
});

router.get('/:userId/followers', async (req, res) => {
    try {
        const user = User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        const followers = user.followers.map(id => User.findById(id)).filter(Boolean);
        res.json(followers);
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ message: 'Erro ao buscar seguidores.' });
    }
});

router.get('/:userId/following', async (req, res) => {
    try {
        const user = User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        const following = user.following.map(id => User.findById(id)).filter(Boolean);
        res.json(following);
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: 'Erro ao buscar utilizadores.' });
    }
});

module.exports = router;
