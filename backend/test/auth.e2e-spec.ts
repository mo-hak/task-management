import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';
import { UserRole } from '../src/projects/types';
import supertest from 'supertest';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let testUtils: TestUtils;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    testUtils = new TestUtils();
    app = await testUtils.initializeApp();
    request = supertest(app.getHttpServer());
  });

  beforeEach(async () => {
    await testUtils.cleanupDatabase();
  });

  afterAll(async () => {
    await testUtils.closeApp();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.firstName).toBe(userData.firstName);
      expect(response.body.lastName).toBe(userData.lastName);
      expect(response.body.role).toBe(UserRole.USER);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should not register a user with existing email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      await testUtils.createTestUser(userData);

      await request
        .post('/auth/register')
        .send(userData)
        .expect(401);
    });

    it('should validate user input', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        firstName: '',
        lastName: '',
      };

      const response = await request
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toEqual(expect.any(Array));
    });
  });

  describe('POST /auth/login', () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(async () => {
      await testUtils.createTestUser(userData);
    });

    it('should login with valid credentials', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
    });

    it('should not login with invalid password', async () => {
      await request
        .post('/auth/login')
        .send({
          email: userData.email,
          password: 'wrong-password',
        })
        .expect(401);
    });

    it('should not login with non-existent email', async () => {
      await request
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password,
        })
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    };

    let token: string;

    beforeEach(async () => {
      await testUtils.createTestUser(userData);
      token = await testUtils.getJwtToken(userData.email, userData.password);
    });

    it('should get user profile with valid token', async () => {
      const response = await request
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.email).toBe(userData.email);
      expect(response.body.firstName).toBe(userData.firstName);
      expect(response.body.lastName).toBe(userData.lastName);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should not get profile without token', async () => {
      await request
        .get('/auth/profile')
        .expect(401);
    });

    it('should not get profile with invalid token', async () => {
      await request
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
}); 