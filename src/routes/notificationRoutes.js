const express = require('express');
const router = express.Router();
const Notification = require('../models/sqlite/Notification');

router.get('/', async (req, res) => {
    try {
        const notifications = await Notification.find({ userTo: req.session.user._id }).limit(50);

        await Notification.markAsRead(req.session.user._id);

        res.render('notificationPage', {
            pageTitle: 'Notificações',
            notifications
        });
    } catch (error) {
        console.error('Notifications error:', error);
        res.render('notificationPage', {
            pageTitle: 'Notificações',
            notifications: [],
            errorMessage: 'Erro ao carregar notificações.'
        });
    }
});

router.get('/count', async (req, res) => {
    try {
        const count = await Notification.getUnreadCount(req.session.user._id);
        res.json({ count });
    } catch (error) {
        console.error('Notification count error:', error);
        res.status(500).json({ count: 0 });
    }
});

router.put('/read', async (req, res) => {
    try {
        const { notificationIds } = req.body;
        await Notification.markAsRead(req.session.user._id, notificationIds);
        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ message: 'Erro ao marcar notificações.' });
    }
});

module.exports = router;
