import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  TaskWithRelations,
  TaskCreateInput,
  TaskUpdateInput,
  TaskWhereUniqueInput,
  TaskWhereInput,
  TaskOrderByInput,
} from './types';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  private readonly defaultInclude = {
    assignee: true,
    creator: true,
    project: true,
    comments: {
      include: {
        user: true,
      },
    },
  };

  async task(taskWhereUniqueInput: TaskWhereUniqueInput): Promise<TaskWithRelations> {
    const task = await this.prisma.task.findUnique({
      where: taskWhereUniqueInput,
      include: this.defaultInclude,
    });

    if (!task) {
      throw new NotFoundException(`Task not found`);
    }

    return task as TaskWithRelations;
  }

  async tasks(params: {
    skip?: number;
    take?: number;
    cursor?: TaskWhereUniqueInput;
    where?: TaskWhereInput;
    orderBy?: TaskOrderByInput;
  }): Promise<TaskWithRelations[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.task.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: this.defaultInclude,
    }) as Promise<TaskWithRelations[]>;
  }

  async createTask(data: TaskCreateInput): Promise<TaskWithRelations> {
    return this.prisma.task.create({
      data,
      include: this.defaultInclude,
    }) as Promise<TaskWithRelations>;
  }

  async updateTask(params: {
    where: TaskWhereUniqueInput;
    data: TaskUpdateInput;
  }): Promise<TaskWithRelations> {
    const { where, data } = params;
    const task = await this.prisma.task.findUnique({ where });
    
    if (!task) {
      throw new NotFoundException(`Task not found`);
    }

    return this.prisma.task.update({
      data,
      where,
      include: this.defaultInclude,
    }) as Promise<TaskWithRelations>;
  }

  async deleteTask(where: TaskWhereUniqueInput): Promise<TaskWithRelations> {
    const task = await this.prisma.task.findUnique({ where });
    
    if (!task) {
      throw new NotFoundException(`Task not found`);
    }

    return this.prisma.task.delete({
      where,
      include: this.defaultInclude,
    }) as Promise<TaskWithRelations>;
  }

  async getTasksByProject(projectId: string): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: { projectId },
      include: this.defaultInclude,
    }) as Promise<TaskWithRelations[]>;
  }

  async getTasksByAssignee(assigneeId: string): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: { assigneeId },
      include: this.defaultInclude,
    }) as Promise<TaskWithRelations[]>;
  }

  async getTasksByCreator(creatorId: string): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: { creatorId },
      include: this.defaultInclude,
    }) as Promise<TaskWithRelations[]>;
  }
} 