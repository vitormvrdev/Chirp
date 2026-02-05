const request = require('supertest');
const app = require('../app');
const User = require('../src/models/user');
const Post = require('../src/models/post');
const bcrypt = require('bcryptjs');

describe('Posts API', () => {
    let agent;
    let testUser;

    beforeEach(async () => {
        // Create test user
        testUser = await User.create({
            firstName: 'Test',
            lastName: 'User',
            userhandle: 'testuser',
            email: 'test@example.com',
            password: await bcrypt.hash('password123', 12)
        });

        // Login to get session
        agent = request.agent(app);
        await agent.post('/login').send({
            logUsername: 'testuser',
            logPassword: 'password123'
        });
    });

    describe('GET /api/posts', () => {
        it('should return empty array when no posts', async () => {
            const res = await agent.get('/api/posts');

            expect(res.status).toBe(200);
            expect(res.body.posts).toEqual([]);
            expect(res.body.pagination).toBeDefined();
        });

        it('should return posts with pagination', async () => {
            // Create some posts
            await Post.create([
                { content: 'Post 1', postedBy: testUser._id },
                { content: 'Post 2', postedBy: testUser._id },
                { content: 'Post 3', postedBy: testUser._id }
            ]);

            const res = await agent.get('/api/posts');

            expect(res.status).toBe(200);
            expect(res.body.posts).toHaveLength(3);
            expect(res.body.pagination.total).toBe(3);
        });

        it('should filter posts by user', async () => {
            const otherUser = await User.create({
                firstName: 'Other',
                lastName: 'User',
                userhandle: 'other',
                email: 'other@example.com',
                password: await bcrypt.hash('password123', 12)
            });

            await Post.create([
                { content: 'Post 1', postedBy: testUser._id },
                { content: 'Post 2', postedBy: otherUser._id }
            ]);

            const res = await agent.get(`/api/posts?postedBy=${testUser._id}`);

            expect(res.status).toBe(200);
            expect(res.body.posts).toHaveLength(1);
            expect(res.body.posts[0].content).toBe('Post 1');
        });
    });

    describe('POST /api/posts', () => {
        it('should create a new post', async () => {
            const res = await agent.post('/api/posts').send({
                content: 'Hello World!'
            });

            expect(res.status).toBe(201);
            expect(res.body.content).toBe('Hello World!');
            expect(res.body.postedBy._id).toBe(testUser._id.toString());
        });

        it('should reject empty content', async () => {
            const res = await agent.post('/api/posts').send({
                content: ''
            });

            expect(res.status).toBe(400);
        });

        it('should reject content over 280 characters', async () => {
            const res = await agent.post('/api/posts').send({
                content: 'a'.repeat(281)
            });

            expect(res.status).toBe(400);
        });

        it('should require authentication', async () => {
            const res = await request(app).post('/api/posts').send({
                content: 'Hello!'
            });

            expect(res.status).toBe(401);
        });
    });

    describe('DELETE /api/posts/:id', () => {
        it('should delete own post', async () => {
            const post = await Post.create({
                content: 'To be deleted',
                postedBy: testUser._id
            });

            const res = await agent.delete(`/api/posts/${post._id}`);

            expect(res.status).toBe(200);

            const deleted = await Post.findById(post._id);
            expect(deleted).toBeNull();
        });

        it('should not delete other users post', async () => {
            const otherUser = await User.create({
                firstName: 'Other',
                lastName: 'User',
                userhandle: 'other',
                email: 'other@example.com',
                password: await bcrypt.hash('password123', 12)
            });

            const post = await Post.create({
                content: 'Not yours',
                postedBy: otherUser._id
            });

            const res = await agent.delete(`/api/posts/${post._id}`);

            expect(res.status).toBe(403);
        });
    });

    describe('PUT /api/posts/:id/like', () => {
        it('should like a post', async () => {
            const post = await Post.create({
                content: 'Like me!',
                postedBy: testUser._id
            });

            const res = await agent.put(`/api/posts/${post._id}/like`);

            expect(res.status).toBe(200);
            expect(res.body.likes).toHaveLength(1);
        });

        it('should unlike a post', async () => {
            const post = await Post.create({
                content: 'Unlike me!',
                postedBy: testUser._id,
                likes: [testUser._id]
            });

            // Update user's likes
            await User.findByIdAndUpdate(testUser._id, {
                $addToSet: { likes: post._id }
            });

            // Re-login to update session
            await agent.post('/login').send({
                logUsername: 'testuser',
                logPassword: 'password123'
            });

            const res = await agent.put(`/api/posts/${post._id}/like`);

            expect(res.status).toBe(200);
            expect(res.body.likes).toHaveLength(0);
        });
    });
});
