import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectWithRelations, ProjectStatus } from './types';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async project(projectWhereUniqueInput: { id: string }): Promise<ProjectWithRelations> {
    const project = await this.prisma.project.findUnique({
      where: projectWhereUniqueInput,
      include: {
        members: true,
        tasks: {
          include: {
            assignee: true,
            creator: true,
            comments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    return project as ProjectWithRelations;
  }

  async projects(params: {
    skip?: number;
    take?: number;
    cursor?: { id: string };
    where?: {
      id?: string;
      name?: string;
      status?: ProjectStatus;
      members?: {
        some: {
          id: string;
        };
      };
      OR?: any[];
    };
    orderBy?: {
      id?: 'asc' | 'desc';
      name?: 'asc' | 'desc';
      createdAt?: 'asc' | 'desc';
      updatedAt?: 'asc' | 'desc';
    };
  }) {
    const { skip = 0, take = 10, cursor, where, orderBy } = params;
    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy,
        include: {
          members: true,
          tasks: {
            include: {
              assignee: true,
              creator: true,
              comments: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: items as ProjectWithRelations[],
      total,
      hasMore: (skip + take) < total,
      page: Math.floor(skip / take) + 1,
      totalPages: Math.ceil(total / take),
    };
  }

  async createProject(data: {
    name: string;
    description?: string;
    status?: ProjectStatus;
    members: {
      connect: { id: string }[];
    };
  }): Promise<ProjectWithRelations> {
    return this.prisma.project.create({
      data,
      include: {
        members: true,
        tasks: {
          include: {
            assignee: true,
            creator: true,
            comments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    }) as Promise<ProjectWithRelations>;
  }

  async updateProject(params: {
    where: { id: string };
    data: {
      name?: string;
      description?: string;
      status?: ProjectStatus;
    };
  }): Promise<ProjectWithRelations> {
    const { where, data } = params;
    const project = await this.prisma.project.findUnique({ where });
    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    return this.prisma.project.update({
      data,
      where,
      include: {
        members: true,
        tasks: {
          include: {
            assignee: true,
            creator: true,
            comments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    }) as Promise<ProjectWithRelations>;
  }

  async deleteProject(where: { id: string }): Promise<ProjectWithRelations> {
    const project = await this.prisma.project.findUnique({ where });
    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    return this.prisma.project.delete({
      where,
      include: {
        members: true,
        tasks: {
          include: {
            assignee: true,
            creator: true,
            comments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    }) as Promise<ProjectWithRelations>;
  }

  async addMemberToProject(projectId: string, userId: string): Promise<ProjectWithRelations> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    const isAlreadyMember = project.members.some((member) => member.id === userId);
    if (isAlreadyMember) {
      throw new NotFoundException(`User is already a member of this project`);
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: {
        members: true,
        tasks: {
          include: {
            assignee: true,
            creator: true,
            comments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    }) as Promise<ProjectWithRelations>;
  }

  async removeMemberFromProject(projectId: string, userId: string): Promise<ProjectWithRelations> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    if (project.members.length === 1) {
      throw new NotFoundException(`Cannot remove the last member from the project`);
    }

    const isMember = project.members.some((member) => member.id === userId);
    if (!isMember) {
      throw new NotFoundException(`User is not a member of this project`);
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
      include: {
        members: true,
        tasks: {
          include: {
            assignee: true,
            creator: true,
            comments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    }) as Promise<ProjectWithRelations>;
  }
} 