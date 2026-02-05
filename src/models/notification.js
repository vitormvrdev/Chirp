const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    userTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userFrom: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notificationType: {
        type: String,
        enum: ['postLike', 'retweet', 'follow', 'comment'],
        required: true
    },
    entityId: { type: Schema.Types.ObjectId },
    opened: { type: Boolean, default: false }
}, { timestamps: true });

// Index for faster queries
NotificationSchema.index({ userTo: 1, createdAt: -1 });
NotificationSchema.index({ userTo: 1, opened: 1 });

NotificationSchema.statics.insertNotification = async function(userTo, userFrom, notificationType, entityId) {
    // Don't create notification for yourself
    if (userTo.toString() === userFrom.toString()) return null;

    const data = {
        userTo,
        userFrom,
        notificationType,
        entityId
    };

    // Delete existing similar notification to avoid duplicates
    await this.deleteOne(data);

    return this.create(data);
};

NotificationSchema.statics.getUnreadCount = async function(userId) {
    return this.countDocuments({ userTo: userId, opened: false });
};

NotificationSchema.statics.markAsRead = async function(userId, notificationIds = null) {
    const query = { userTo: userId };
    if (notificationIds) {
        query._id = { $in: notificationIds };
    }
    return this.updateMany(query, { opened: true });
};

module.exports = mongoose.model('Notification', NotificationSchema);
