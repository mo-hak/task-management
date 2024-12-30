import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';
import { UserRole, ProjectStatus } from '../src/projects/types';
import supertest from 'supertest';

describe('ProjectsController (e2e)', () => {
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

  describe('POST /projects', () => {
    let token: string;
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(async () => {
      await testUtils.createTestUser(userData);
      token = await testUtils.getJwtToken(userData.email, userData.password);
    });

    it('should create a new project', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
        status: ProjectStatus.ACTIVE,
      };

      const response = await request
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send(projectData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(projectData.name);
      expect(response.body.description).toBe(projectData.description);
      expect(response.body.status).toBe(projectData.status);
      expect(response.body.members).toHaveLength(1);
      expect(response.body.members[0].email).toBe(userData.email);
    });

    it('should validate project input', async () => {
      const invalidData = {
        description: 'Missing name',
        status: 'INVALID_STATUS',
      };

      const response = await request
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toEqual(expect.any(Array));
    });
  });

  describe('GET /projects', () => {
    let token: string;
    let adminToken: string;
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    };
    const adminData = {
      ...userData,
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    };

    beforeEach(async () => {
      await testUtils.createTestUser(userData);
      await testUtils.createTestUser(adminData);
      token = await testUtils.getJwtToken(userData.email, userData.password);
      adminToken = await testUtils.getJwtToken(adminData.email, adminData.password);

      // Create test projects
      const prisma = testUtils.getPrisma();
      await prisma.project.createMany({
        data: [
          {
            name: 'Project 1',
            description: 'Description 1',
            status: ProjectStatus.ACTIVE,
          },
          {
            name: 'Project 2',
            description: 'Description 2',
            status: ProjectStatus.COMPLETED,
          },
        ],
      });
    });

    it('should get all projects for admin', async () => {
      const response = await request
        .get('/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('should get only accessible projects for regular user', async () => {
      const response = await request
        .get('/projects')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.items).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });

    it('should filter projects by status', async () => {
      const response = await request
        .get('/projects')
        .query({ status: ProjectStatus.ACTIVE })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].status).toBe(ProjectStatus.ACTIVE);
    });
  });

  describe('Project Member Management', () => {
    let token: string;
    let projectId: string;
    let userId: string;
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.ADMIN,
    };

    beforeEach(async () => {
      const user = await testUtils.createTestUser(userData);
      userId = user.id;
      token = await testUtils.getJwtToken(userData.email, userData.password);

      const prisma = testUtils.getPrisma();
      const project = await prisma.project.create({
        data: {
          name: 'Test Project',
          description: 'Test Description',
          status: ProjectStatus.ACTIVE,
          members: {
            connect: { id: userId },
          },
        },
      });
      projectId = project.id;
    });

    it('should add a member to project', async () => {
      const newUser = await testUtils.createTestUser({
        email: 'member@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'Member',
      });

      const response = await request
        .post(`/projects/${projectId}/members/${newUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.members).toHaveLength(2);
      expect(response.body.members.some(m => m.id === newUser.id)).toBeTruthy();
    });

    it('should remove a member from project', async () => {
      const newUser = await testUtils.createTestUser({
        email: 'member@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'Member',
      });

      await request
        .post(`/projects/${projectId}/members/${newUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const response = await request
        .delete(`/projects/${projectId}/members/${newUser.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.members).toHaveLength(1);
      expect(response.body.members.some(m => m.id === newUser.id)).toBeFalsy();
    });

    it('should not remove the last member from project', async () => {
      await request
        .delete(`/projects/${projectId}/members/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
}); 