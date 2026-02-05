const { db, generateId } = require('../../../config/database');
const User = require('./User');

class Comment {
    static find(query = {}) {
        let sql = 'SELECT * FROM comments';
        const params = [];

        if (query.onPost) {
            sql += ' WHERE onPost = ?';
            params.push(query.onPost);
        }

        sql += ' ORDER BY createdAt DESC';

        const comments = db.prepare(sql).all(...params);
        return new CommentQuery(comments);
    }

    static findById(id) {
        const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
        return comment ? this._enrichComment(comment) : null;
    }

    static async create(data) {
        const id = generateId();
        db.prepare(`
            INSERT INTO comments (id, content, postedBy, onPost)
            VALUES (?, ?, ?, ?)
        `).run(id, data.content, data.postedBy, data.onPost);
        return this.findById(id);
    }

    static findByIdAndDelete(id) {
        const comment = this.findById(id);
        if (comment) {
            db.prepare('DELETE FROM comments WHERE id = ?').run(id);
        }
        return comment;
    }

    static deleteMany(query) {
        if (query.onPost) {
            db.prepare('DELETE FROM comments WHERE onPost = ?').run(query.onPost);
        }
    }

    static _enrichComment(comment) {
        if (!comment) return null;

        const postedBy = User.findById(comment.postedBy);

        return {
            ...comment,
            _id: comment.id,
            postedBy,
            toObject: () => ({ ...comment, _id: comment.id }),
            toString: () => comment.id
        };
    }
}

class CommentQuery {
    constructor(comments) {
        this._comments = comments;
    }

    populate(path) {
        return this;
    }

    sort(options) {
        return this;
    }

    then(resolve, reject) {
        try {
            const enriched = this._comments.map(c => Comment._enrichComment(c));
            resolve(enriched);
        } catch (error) {
            reject(error);
        }
    }
}

module.exports = Comment;
