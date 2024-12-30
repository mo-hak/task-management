import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  async createUser(
    @Body() userData: { email: string; password: string; firstName: string; lastName: string },
  ): Promise<User> {
    return this.usersService.createUser(userData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async getUsers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<User[]> {
    return this.usersService.users({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  async getUser(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.user({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  async updateUser(
    @Param('id') id: string,
    @Body() userData: { email?: string; password?: string; firstName?: string; lastName?: string },
  ): Promise<User> {
    return this.usersService.updateUser({
      where: { id },
      data: userData,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  async deleteUser(@Param('id') id: string): Promise<User> {
    return this.usersService.deleteUser({ id });
  }
} 