const { db, generateId } = require('../../../config/database');

class User {
    static findOne(query) {
        let sql = 'SELECT * FROM users WHERE ';
        const conditions = [];
        const params = [];

        if (query.$or) {
            const orConditions = query.$or.map(cond => {
                const key = Object.keys(cond)[0];
                params.push(cond[key]);
                return `${key} = ?`;
            });
            sql += `(${orConditions.join(' OR ')})`;
        } else {
            for (const [key, value] of Object.entries(query)) {
                conditions.push(`${key} = ?`);
                params.push(value);
            }
            sql += conditions.join(' AND ');
        }

        const user = db.prepare(sql).get(...params);
        return user ? this._enrichUser(user) : null;
    }

    static findById(id) {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        return user ? this._enrichUser(user) : null;
    }

    static find(query = {}) {
        let sql = 'SELECT * FROM users';
        const params = [];

        if (query.$or) {
            const orConditions = query.$or.map(cond => {
                const key = Object.keys(cond)[0];
                const value = cond[key];
                if (value.$regex) {
                    params.push(`%${value.$regex}%`);
                    return `${key} LIKE ?`;
                }
                params.push(value);
                return `${key} = ?`;
            });
            sql += ` WHERE (${orConditions.join(' OR ')})`;
        }

        const users = db.prepare(sql).all(...params);
        return users.map(u => this._enrichUser(u));
    }

    static async create(data) {
        const id = generateId();
        const stmt = db.prepare(`
            INSERT INTO users (id, firstName, lastName, userhandle, email, password, profilePic)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(id, data.firstName, data.lastName, data.userhandle, data.email, data.password, data.profilePic || '/images/profile_pic.png');
        return this.findById(id);
    }

    static findByIdAndUpdate(id, update, options = {}) {
        if (update.$addToSet || update.$pull) {
            // Handle likes array
            if (update.$addToSet?.likes) {
                db.prepare('INSERT OR IGNORE INTO likes (userId, postId) VALUES (?, ?)').run(id, update.$addToSet.likes);
            }
            if (update.$pull?.likes) {
                db.prepare('DELETE FROM likes WHERE userId = ? AND postId = ?').run(id, update.$pull.likes);
            }
            // Handle following array
            if (update.$addToSet?.following) {
                db.prepare('INSERT OR IGNORE INTO follows (followerId, followingId) VALUES (?, ?)').run(id, update.$addToSet.following);
            }
            if (update.$pull?.following) {
                db.prepare('DELETE FROM follows WHERE followerId = ? AND followingId = ?').run(id, update.$pull.following);
            }
            // Handle retweets array
            if (update.$addToSet?.retweets) {
                db.prepare('INSERT OR IGNORE INTO retweets (userId, postId) VALUES (?, ?)').run(id, update.$addToSet.retweets);
            }
            if (update.$pull?.retweets) {
                db.prepare('DELETE FROM retweets WHERE userId = ? AND postId = ?').run(id, update.$pull.retweets);
            }
        } else {
            const sets = [];
            const params = [];
            for (const [key, value] of Object.entries(update)) {
                sets.push(`${key} = ?`);
                params.push(value);
            }
            params.push(id);
            db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...params);
        }

        return this.findById(id);
    }

    static _enrichUser(user) {
        if (!user) return null;

        // Get likes
        const likes = db.prepare('SELECT postId FROM likes WHERE userId = ?').all(user.id).map(r => r.postId);

        // Get following
        const following = db.prepare('SELECT followingId FROM follows WHERE followerId = ?').all(user.id).map(r => r.followingId);

        // Get followers
        const followers = db.prepare('SELECT followerId FROM follows WHERE followingId = ?').all(user.id).map(r => r.followerId);

        // Get retweets
        const retweets = db.prepare('SELECT postId FROM retweets WHERE userId = ?').all(user.id).map(r => r.postId);

        return {
            ...user,
            _id: user.id,
            likes,
            following,
            followers,
            retweets,
            toObject: () => ({ ...user, _id: user.id, likes, following, followers, retweets }),
            toString: () => user.id
        };
    }

    // For populating
    static populate(users, options) {
        if (!Array.isArray(users)) {
            users = [users];
        }

        return users.map(user => {
            if (options.path === 'followers') {
                user.followers = user.followers.map(id => this.findById(id));
            }
            if (options.path === 'following') {
                user.following = user.following.map(id => this.findById(id));
            }
            return user;
        });
    }
}

module.exports = User;
