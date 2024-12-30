import { User } from '../projects/types';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  assigneeId?: string;
  creatorId: string;
}

export interface TaskWithRelations extends Task {
  assignee?: User;
  creator: User;
  project: {
    id: string;
    name: string;
    description?: string;
    status: string;
  };
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  taskId: string;
  userId: string;
  user: User;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: Date;
  projectId: string;
  assigneeId?: string;
  creatorId: string;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: Date;
  assigneeId?: string;
}

export interface TaskWhereUniqueInput {
  id: string;
}

export interface TaskWhereInput {
  id?: string;
  title?: string;
  status?: TaskStatus;
  priority?: Priority;
  projectId?: string;
  assigneeId?: string;
  creatorId?: string;
}

export interface TaskOrderByInput {
  id?: 'asc' | 'desc';
  title?: 'asc' | 'desc';
  status?: 'asc' | 'desc';
  priority?: 'asc' | 'desc';
  dueDate?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
  updatedAt?: 'asc' | 'desc';
} 