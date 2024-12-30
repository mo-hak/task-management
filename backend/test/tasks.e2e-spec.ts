import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';
import { UserRole, ProjectStatus } from '../src/projects/types';
import { TaskStatus, Priority } from '../src/tasks/types';
import supertest from 'supertest';

describe('TasksController (e2e)', () => {
  let app: INestApplication;
  let testUtils: TestUtils;
  let request: supertest.SuperTest<supertest.Test>;
  let projectId: string;
  let userId: string;
  let token: string;

  beforeAll(async () => {
    testUtils = new TestUtils();
    app = await testUtils.initializeApp();
    request = supertest(app.getHttpServer());
  });

  beforeEach(async () => {
    await testUtils.cleanupDatabase();

    // Create test user and project
    const user = await testUtils.createTestUser({
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.ADMIN,
    });
    userId = user.id;
    token = await testUtils.getJwtToken(user.email, 'Password123!');

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

  afterAll(async () => {
    await testUtils.closeApp();
  });

  describe('POST /tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        projectId,
      };

      const response = await request
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(taskData.title);
      expect(response.body.description).toBe(taskData.description);
      expect(response.body.status).toBe(taskData.status);
      expect(response.body.priority).toBe(taskData.priority);
      expect(response.body.creatorId).toBe(userId);
    });

    it('should validate task input', async () => {
      const invalidData = {
        description: 'Missing title',
        status: 'INVALID_STATUS',
        priority: 'INVALID_PRIORITY',
      };

      const response = await request
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toEqual(expect.any(Array));
    });
  });

  describe('GET /tasks', () => {
    beforeEach(async () => {
      const prisma = testUtils.getPrisma();
      await prisma.task.createMany({
        data: [
          {
            title: 'Task 1',
            description: 'Description 1',
            status: TaskStatus.TODO,
            priority: Priority.HIGH,
            projectId,
            creatorId: userId,
          },
          {
            title: 'Task 2',
            description: 'Description 2',
            status: TaskStatus.IN_PROGRESS,
            priority: Priority.MEDIUM,
            projectId,
            creatorId: userId,
          },
        ],
      });
    });

    it('should get all tasks', async () => {
      const response = await request
        .get('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.items).toHaveLength(2);
    });

    it('should filter tasks by status', async () => {
      const response = await request
        .get('/tasks')
        .query({ status: TaskStatus.TODO })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].status).toBe(TaskStatus.TODO);
    });

    it('should filter tasks by priority', async () => {
      const response = await request
        .get('/tasks')
        .query({ priority: Priority.HIGH })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].priority).toBe(Priority.HIGH);
    });
  });

  describe('Task Assignment', () => {
    let taskId: string;
    let assigneeId: string;

    beforeEach(async () => {
      const assignee = await testUtils.createTestUser({
        email: 'assignee@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'Assignee',
      });
      assigneeId = assignee.id;

      const prisma = testUtils.getPrisma();
      const task = await prisma.task.create({
        data: {
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.TODO,
          priority: Priority.MEDIUM,
          projectId,
          creatorId: userId,
        },
      });
      taskId = task.id;
    });

    it('should assign a task to a user', async () => {
      const response = await request
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ assigneeId })
        .expect(200);

      expect(response.body.assigneeId).toBe(assigneeId);
    });

    it('should update task status', async () => {
      const response = await request
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(200);

      expect(response.body.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should not assign task to non-project member', async () => {
      const nonMember = await testUtils.createTestUser({
        email: 'nonmember@example.com',
        password: 'Password123!',
        firstName: 'Non',
        lastName: 'Member',
      });

      await request
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ assigneeId: nonMember.id })
        .expect(403);
    });
  });
}); 