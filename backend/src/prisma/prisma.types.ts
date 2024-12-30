import { PrismaClient } from '@prisma/client';

export type PrismaService = PrismaClient;

export interface PrismaTransaction extends Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'> {}

export interface ProjectCreateInput {
  name: string;
  description?: string;
  status?: string;
  members?: {
    connect: { id: string }[];
  };
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  status?: string;
  members?: {
    connect?: { id: string }[];
    disconnect?: { id: string }[];
  };
}

export interface ProjectWhereUniqueInput {
  id: string;
}

export interface ProjectWhereInput {
  id?: string;
  name?: string;
  status?: string;
  members?: {
    some: {
      id: string;
    };
  };
  OR?: ProjectWhereInput[];
}

export interface ProjectOrderByInput {
  id?: 'asc' | 'desc';
  name?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
  updatedAt?: 'asc' | 'desc';
} 