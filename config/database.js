const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'chirp.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        userhandle TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profilePic TEXT DEFAULT '/images/profile_pic.png',
        bio TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        content TEXT,
        postedBy TEXT NOT NULL,
        pinned INTEGER DEFAULT 0,
        retweetData TEXT,
        imageUrl TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (postedBy) REFERENCES users(id),
        FOREIGN KEY (retweetData) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
        userId TEXT NOT NULL,
        postId TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (userId, postId),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS retweets (
        userId TEXT NOT NULL,
        postId TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (userId, postId),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS follows (
        followerId TEXT NOT NULL,
        followingId TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (followerId, followingId),
        FOREIGN KEY (followerId) REFERENCES users(id),
        FOREIGN KEY (followingId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        postedBy TEXT NOT NULL,
        onPost TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (postedBy) REFERENCES users(id),
        FOREIGN KEY (onPost) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        userTo TEXT NOT NULL,
        userFrom TEXT NOT NULL,
        notificationType TEXT NOT NULL,
        entityId TEXT,
        opened INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userTo) REFERENCES users(id),
        FOREIGN KEY (userFrom) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_posts_postedBy ON posts(postedBy);
    CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_userTo ON notifications(userTo);
`);

// Generate UUID
function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Seed fake data
async function seedData() {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    if (userCount > 0) {
        console.log('Database already has data, skipping seed.');
        return;
    }

    console.log('Seeding fake data...');

    // Create fake users
    const hashedPassword = await bcrypt.hash('password123', 12);

    const users = [
        { id: generateId(), firstName: 'João', lastName: 'Silva', userhandle: 'joaosilva', email: 'joao@example.com' },
        { id: generateId(), firstName: 'Maria', lastName: 'Santos', userhandle: 'mariasantos', email: 'maria@example.com' },
        { id: generateId(), firstName: 'Pedro', lastName: 'Costa', userhandle: 'pedrocosta', email: 'pedro@example.com' },
        { id: generateId(), firstName: 'Ana', lastName: 'Oliveira', userhandle: 'anaoliveira', email: 'ana@example.com' },
        { id: generateId(), firstName: 'Demo', lastName: 'User', userhandle: 'demo', email: 'demo@example.com' },
    ];

    const insertUser = db.prepare(`
        INSERT INTO users (id, firstName, lastName, userhandle, email, password)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const user of users) {
        insertUser.run(user.id, user.firstName, user.lastName, user.userhandle, user.email, hashedPassword);
    }

    // Create fake posts
    const posts = [
        { id: generateId(), content: 'Olá a todos! Este é o meu primeiro tweet no Chirp! 🎉', postedBy: users[0].id },
        { id: generateId(), content: 'Que dia lindo para programar! ☀️💻', postedBy: users[1].id },
        { id: generateId(), content: 'Acabei de descobrir esta plataforma incrível. Muito bem feita!', postedBy: users[2].id },
        { id: generateId(), content: 'Alguém aqui gosta de JavaScript? É a minha linguagem favorita!', postedBy: users[3].id },
        { id: generateId(), content: 'Bom dia Chirp! Vamos começar o dia com energia! 💪', postedBy: users[4].id },
        { id: generateId(), content: 'A trabalhar num projeto muito interessante. Em breve partilho mais!', postedBy: users[0].id },
        { id: generateId(), content: 'Quem mais está a aprender Node.js? É fantástico! 🚀', postedBy: users[1].id },
        { id: generateId(), content: 'Pensamento do dia: O código limpo é arte.', postedBy: users[2].id },
        { id: generateId(), content: 'Finalmente terminei aquele bug que me estava a dar dores de cabeça!', postedBy: users[3].id },
        { id: generateId(), content: 'Café + código = produtividade máxima ☕', postedBy: users[4].id },
    ];

    const insertPost = db.prepare(`
        INSERT INTO posts (id, content, postedBy, createdAt)
        VALUES (?, ?, ?, datetime('now', '-' || ? || ' hours'))
    `);

    posts.forEach((post, index) => {
        insertPost.run(post.id, post.content, post.postedBy, index * 2);
    });

    // Add some likes
    const insertLike = db.prepare('INSERT OR IGNORE INTO likes (userId, postId) VALUES (?, ?)');
    insertLike.run(users[1].id, posts[0].id);
    insertLike.run(users[2].id, posts[0].id);
    insertLike.run(users[3].id, posts[0].id);
    insertLike.run(users[0].id, posts[1].id);
    insertLike.run(users[4].id, posts[1].id);
    insertLike.run(users[0].id, posts[4].id);
    insertLike.run(users[1].id, posts[4].id);

    // Add some follows
    const insertFollow = db.prepare('INSERT OR IGNORE INTO follows (followerId, followingId) VALUES (?, ?)');
    insertFollow.run(users[0].id, users[1].id);
    insertFollow.run(users[0].id, users[2].id);
    insertFollow.run(users[1].id, users[0].id);
    insertFollow.run(users[2].id, users[0].id);
    insertFollow.run(users[3].id, users[0].id);
    insertFollow.run(users[4].id, users[0].id);
    insertFollow.run(users[4].id, users[1].id);

    console.log('Seeded 5 users, 10 posts, likes, and follows.');
    console.log('Demo login: demo@example.com / password123');
}

module.exports = { db, generateId, seedData };
