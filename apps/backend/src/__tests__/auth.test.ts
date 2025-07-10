import request from 'supertest';
import app from '../index';

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.token).toBeDefined();
    });

    it('should return 409 if user already exists', async () => {
      // First registration
      await request(app).post('/api/auth/register').send({
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'Test User',
      });

      // Second registration with same email
      const res = await request(app).post('/api/auth/register').send({
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app).post('/api/auth/register').send({
        email: 'login@example.com',
        password: 'password123',
        name: 'Login User',
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('login@example.com');
      expect(res.body.data.token).toBeDefined();
    });

    it('should return 401 with invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
