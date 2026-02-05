const { db, generateId } = require('../../../config/database');
const User = require('./User');

class Post {
    static find(query = {}) {
        let sql = 'SELECT * FROM posts';
        const params = [];
        const conditions = [];

        if (query.postedBy) {
            conditions.push('postedBy = ?');
            params.push(query.postedBy);
        }

        if (query.content?.$regex) {
            conditions.push('content LIKE ?');
            params.push(`%${query.content.$regex}%`);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY createdAt DESC';

        const posts = db.prepare(sql).all(...params);
        return new PostQuery(posts);
    }

    static findById(id) {
        const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
        return post ? this._enrichPost(post) : null;
    }

    static findOne(query) {
        let sql = 'SELECT * FROM posts WHERE ';
        const conditions = [];
        const params = [];

        for (const [key, value] of Object.entries(query)) {
            conditions.push(`${key} = ?`);
            params.push(value);
        }

        sql += conditions.join(' AND ') + ' LIMIT 1';
        const post = db.prepare(sql).get(...params);
        return post ? this._enrichPost(post) : null;
    }

    static async create(data) {
        const id = generateId();
        const stmt = db.prepare(`
            INSERT INTO posts (id, content, postedBy, retweetData, imageUrl)
            VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(id, data.content || null, data.postedBy, data.retweetData || null, data.imageUrl || null);
        return this.findById(id);
    }

    static findByIdAndUpdate(id, update, options = {}) {
        if (update.$addToSet || update.$pull) {
            // Handle likes array
            if (update.$addToSet?.likes) {
                db.prepare('INSERT OR IGNORE INTO likes (userId, postId) VALUES (?, ?)').run(update.$addToSet.likes, id);
            }
            if (update.$pull?.likes) {
                db.prepare('DELETE FROM likes WHERE userId = ? AND postId = ?').run(update.$pull.likes, id);
            }
            // Handle retweetUsers array
            if (update.$addToSet?.retweetUsers) {
                db.prepare('INSERT OR IGNORE INTO retweets (userId, postId) VALUES (?, ?)').run(update.$addToSet.retweetUsers, id);
            }
            if (update.$pull?.retweetUsers) {
                db.prepare('DELETE FROM retweets WHERE userId = ? AND postId = ?').run(update.$pull.retweetUsers, id);
            }
        } else {
            const sets = [];
            const params = [];
            for (const [key, value] of Object.entries(update)) {
                sets.push(`${key} = ?`);
                params.push(value);
            }
            if (sets.length > 0) {
                params.push(id);
                db.prepare(`UPDATE posts SET ${sets.join(', ')} WHERE id = ?`).run(...params);
            }
        }

        return this.findById(id);
    }

    static findByIdAndDelete(id) {
        const post = this.findById(id);
        if (post) {
            db.prepare('DELETE FROM posts WHERE id = ?').run(id);
        }
        return post;
    }

    static findOneAndDelete(query) {
        const post = this.findOne(query);
        if (post) {
            db.prepare('DELETE FROM posts WHERE id = ?').run(post.id);
        }
        return post;
    }

    static countDocuments(query = {}) {
        let sql = 'SELECT COUNT(*) as count FROM posts';
        const params = [];

        if (query.postedBy) {
            sql += ' WHERE postedBy = ?';
            params.push(query.postedBy);
        }

        return db.prepare(sql).get(...params).count;
    }

    static _enrichPost(post) {
        if (!post) return null;

        // Get likes
        const likes = db.prepare('SELECT userId FROM likes WHERE postId = ?').all(post.id).map(r => r.userId);

        // Get retweet users
        const retweetUsers = db.prepare('SELECT userId FROM retweets WHERE postId = ?').all(post.id).map(r => r.userId);

        // Get author
        const postedBy = User.findById(post.postedBy);

        // Get retweet data if exists
        let retweetData = null;
        if (post.retweetData) {
            retweetData = this.findById(post.retweetData);
        }

        return {
            ...post,
            _id: post.id,
            likes,
            retweetUsers,
            postedBy,
            retweetData,
            toObject: () => ({ ...post, _id: post.id, likes, retweetUsers }),
            toString: () => post.id
        };
    }

    static populate(post, options) {
        // Already populated in _enrichPost
        return post;
    }
}

// Query builder for chaining
class PostQuery {
    constructor(posts) {
        this._posts = posts;
        this._skip = 0;
        this._limit = 0;
    }

    populate(path) {
        // Populate is handled in _enrichPost
        return this;
    }

    sort(options) {
        // Already sorted by createdAt DESC in the query
        return this;
    }

    skip(n) {
        this._skip = n;
        return this;
    }

    limit(n) {
        this._limit = n;
        return this;
    }

    then(resolve, reject) {
        try {
            let posts = this._posts;

            if (this._skip > 0) {
                posts = posts.slice(this._skip);
            }

            if (this._limit > 0) {
                posts = posts.slice(0, this._limit);
            }

            const enrichedPosts = posts.map(p => Post._enrichPost(p));
            resolve(enrichedPosts);
        } catch (error) {
            reject(error);
        }
    }
}

module.exports = Post;
