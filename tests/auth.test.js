const request = require('supertest');
const app = require('../app');
const User = require('../src/models/user');
const bcrypt = require('bcryptjs');

describe('Authentication', () => {
    describe('POST /register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/register')
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123',
                    passwordConf: 'password123'
                });

            expect(res.status).toBe(302); // Redirect after success
            expect(res.headers.location).toBe('/');

            const user = await User.findOne({ email: 'test@example.com' });
            expect(user).toBeTruthy();
            expect(user.userhandle).toBe('testuser');
        });

        it('should reject registration with invalid email', async () => {
            const res = await request(app)
                .post('/register')
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    username: 'testuser',
                    email: 'invalid-email',
                    password: 'password123',
                    passwordConf: 'password123'
                });

            expect(res.status).toBe(400);
        });

        it('should reject registration with mismatched passwords', async () => {
            const res = await request(app)
                .post('/register')
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123',
                    passwordConf: 'different'
                });

            expect(res.status).toBe(400);
        });

        it('should reject registration with short password', async () => {
            const res = await request(app)
                .post('/register')
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    username: 'testuser',
                    email: 'test@example.com',
                    password: '123',
                    passwordConf: '123'
                });

            expect(res.status).toBe(400);
        });

        it('should reject duplicate email', async () => {
            await User.create({
                firstName: 'Existing',
                lastName: 'User',
                userhandle: 'existing',
                email: 'test@example.com',
                password: await bcrypt.hash('password123', 12)
            });

            const res = await request(app)
                .post('/register')
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    username: 'newuser',
                    email: 'test@example.com',
                    password: 'password123',
                    passwordConf: 'password123'
                });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /login', () => {
        beforeEach(async () => {
            await User.create({
                firstName: 'Test',
                lastName: 'User',
                userhandle: 'testuser',
                email: 'test@example.com',
                password: await bcrypt.hash('password123', 12)
            });
        });

        it('should login with valid credentials (email)', async () => {
            const res = await request(app)
                .post('/login')
                .send({
                    logUsername: 'test@example.com',
                    logPassword: 'password123'
                });

            expect(res.status).toBe(302);
            expect(res.headers.location).toBe('/');
        });

        it('should login with valid credentials (username)', async () => {
            const res = await request(app)
                .post('/login')
                .send({
                    logUsername: 'testuser',
                    logPassword: 'password123'
                });

            expect(res.status).toBe(302);
            expect(res.headers.location).toBe('/');
        });

        it('should reject invalid password', async () => {
            const res = await request(app)
                .post('/login')
                .send({
                    logUsername: 'test@example.com',
                    logPassword: 'wrongpassword'
                });

            expect(res.status).toBe(401);
        });

        it('should reject non-existent user', async () => {
            const res = await request(app)
                .post('/login')
                .send({
                    logUsername: 'nobody@example.com',
                    logPassword: 'password123'
                });

            expect(res.status).toBe(401);
        });
    });
});
