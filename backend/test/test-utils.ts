import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '../src/projects/types';
import supertest from 'supertest';

export class TestUtils {
  private app: INestApplication;
  private prisma: PrismaService;
  private moduleFixture: TestingModule;

  async initializeApp() {
    this.moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = this.moduleFixture.createNestApplication();
    this.prisma = this.app.get<PrismaService>(PrismaService);

    // Apply global pipes and middleware
    this.app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));

    await this.app.init();
    return this.app;
  }

  async cleanupDatabase() {
    const tablenames = await this.prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    try {
      await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error) {
      console.log('Error cleaning up database:', error);
    }
  }

  async closeApp() {
    await this.app.close();
  }

  getApp(): INestApplication {
    return this.app;
  }

  getPrisma(): PrismaService {
    return this.prisma;
  }

  // Helper method to create a test user
  async createTestUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }) {
    return this.prisma.user.create({
      data: {
        ...data,
        role: data.role || UserRole.USER,
        password: await this.hashPassword(data.password),
      },
    });
  }

  // Helper method to get JWT token for a user
  async getJwtToken(email: string, password: string) {
    const response = await supertest(this.app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
    
    return response.body.access_token;
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(password, 10);
  }
} 