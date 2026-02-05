const request = require('supertest');
const app = require('../app');
const User = require('../src/models/user');
const bcrypt = require('bcryptjs');

describe('Follow API', () => {
    let agent;
    let testUser;
    let otherUser;

    beforeEach(async () => {
        // Create test users
        testUser = await User.create({
            firstName: 'Test',
            lastName: 'User',
            userhandle: 'testuser',
            email: 'test@example.com',
            password: await bcrypt.hash('password123', 12)
        });

        otherUser = await User.create({
            firstName: 'Other',
            lastName: 'User',
            userhandle: 'other',
            email: 'other@example.com',
            password: await bcrypt.hash('password123', 12)
        });

        // Login
        agent = request.agent(app);
        await agent.post('/login').send({
            logUsername: 'testuser',
            logPassword: 'password123'
        });
    });

    describe('PUT /api/follow/:userId', () => {
        it('should follow a user', async () => {
            const res = await agent.put(`/api/follow/${otherUser._id}`);

            expect(res.status).toBe(200);
            expect(res.body.isFollowing).toBe(true);

            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.following).toContainEqual(otherUser._id);
        });

        it('should unfollow a user', async () => {
            // First follow
            await agent.put(`/api/follow/${otherUser._id}`);

            // Re-login to update session
            await agent.post('/login').send({
                logUsername: 'testuser',
                logPassword: 'password123'
            });

            // Then unfollow
            const res = await agent.put(`/api/follow/${otherUser._id}`);

            expect(res.status).toBe(200);
            expect(res.body.isFollowing).toBe(false);
        });

        it('should not allow following yourself', async () => {
            const res = await agent.put(`/api/follow/${testUser._id}`);

            expect(res.status).toBe(400);
        });

        it('should return 404 for non-existent user', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await agent.put(`/api/follow/${fakeId}`);

            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/follow/:userId/followers', () => {
        it('should return followers list', async () => {
            // Follow the other user
            await agent.put(`/api/follow/${otherUser._id}`);

            const res = await agent.get(`/api/follow/${otherUser._id}/followers`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].userhandle).toBe('testuser');
        });
    });

    describe('GET /api/follow/:userId/following', () => {
        it('should return following list', async () => {
            // Follow the other user
            await agent.put(`/api/follow/${otherUser._id}`);

            const res = await agent.get(`/api/follow/${testUser._id}/following`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].userhandle).toBe('other');
        });
    });
});
