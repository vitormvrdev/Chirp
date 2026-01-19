// src/routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
// Ajustamos o caminho para chegar à pasta models (sobe um nível com ../)
const Notification = require('../models/notification'); 

router.get("/", async (req, res, next) => {
    try {
        var notifications = await Notification.find({ userTo: req.session.user._id })
            .populate("userFrom")
            .populate("entityId")
            .sort({ createdAt: -1 });

        res.render("notificationsPage", {
            pageTitle: "Notificações",
            userLoggedIn: req.session.user,
            userLoggedInJs: JSON.stringify(req.session.user),
            notifications: notifications
        });
    } catch (error) {
        console.log(error);
        res.sendStatus(400);
    }
});

module.exports = router;