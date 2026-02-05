const { db, generateId } = require('../../../config/database');
const User = require('./User');

class Notification {
    static find(query = {}) {
        let sql = 'SELECT * FROM notifications';
        const params = [];

        if (query.userTo) {
            sql += ' WHERE userTo = ?';
            params.push(query.userTo);
        }

        sql += ' ORDER BY createdAt DESC';

        const notifications = db.prepare(sql).all(...params);
        return new NotificationQuery(notifications);
    }

    static findById(id) {
        const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
        return notification ? this._enrichNotification(notification) : null;
    }

    static async create(data) {
        const id = generateId();
        db.prepare(`
            INSERT INTO notifications (id, userTo, userFrom, notificationType, entityId)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, data.userTo, data.userFrom, data.notificationType, data.entityId);
        return this.findById(id);
    }

    static deleteOne(query) {
        const conditions = [];
        const params = [];

        for (const [key, value] of Object.entries(query)) {
            conditions.push(`${key} = ?`);
            params.push(value);
        }

        if (conditions.length > 0) {
            db.prepare(`DELETE FROM notifications WHERE ${conditions.join(' AND ')}`).run(...params);
        }
    }

    static countDocuments(query = {}) {
        let sql = 'SELECT COUNT(*) as count FROM notifications';
        const conditions = [];
        const params = [];

        if (query.userTo) {
            conditions.push('userTo = ?');
            params.push(query.userTo);
        }

        if (query.opened !== undefined) {
            conditions.push('opened = ?');
            params.push(query.opened ? 1 : 0);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        return db.prepare(sql).get(...params).count;
    }

    static updateMany(query, update) {
        const conditions = [];
        const params = [];

        const sets = [];
        for (const [key, value] of Object.entries(update)) {
            sets.push(`${key} = ?`);
            params.push(key === 'opened' ? (value ? 1 : 0) : value);
        }

        if (query.userTo) {
            conditions.push('userTo = ?');
            params.push(query.userTo);
        }

        if (query._id?.$in) {
            conditions.push(`id IN (${query._id.$in.map(() => '?').join(', ')})`);
            params.push(...query._id.$in);
        }

        let sql = `UPDATE notifications SET ${sets.join(', ')}`;
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        db.prepare(sql).run(...params);
    }

    static async insertNotification(userTo, userFrom, notificationType, entityId) {
        // Don't create notification for yourself
        if (userTo === userFrom || userTo?.toString() === userFrom?.toString()) {
            return null;
        }

        const data = { userTo, userFrom, notificationType, entityId };

        // Delete existing similar notification
        this.deleteOne(data);

        return this.create(data);
    }

    static async getUnreadCount(userId) {
        return this.countDocuments({ userTo: userId, opened: false });
    }

    static async markAsRead(userId, notificationIds = null) {
        const query = { userTo: userId };
        if (notificationIds) {
            query._id = { $in: notificationIds };
        }
        return this.updateMany(query, { opened: true });
    }

    static _enrichNotification(notification) {
        if (!notification) return null;

        const userFrom = User.findById(notification.userFrom);

        return {
            ...notification,
            _id: notification.id,
            opened: notification.opened === 1,
            userFrom,
            toObject: () => ({ ...notification, _id: notification.id }),
            toString: () => notification.id
        };
    }
}

class NotificationQuery {
    constructor(notifications) {
        this._notifications = notifications;
        this._limit = 0;
    }

    populate(path) {
        return this;
    }

    sort(options) {
        return this;
    }

    limit(n) {
        this._limit = n;
        return this;
    }

    then(resolve, reject) {
        try {
            let notifications = this._notifications;

            if (this._limit > 0) {
                notifications = notifications.slice(0, this._limit);
            }

            const enriched = notifications.map(n => Notification._enrichNotification(n));
            resolve(enriched);
        } catch (error) {
            reject(error);
        }
    }
}

module.exports = Notification;
