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
  Request,
  ForbiddenException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus, Priority } from './types';
import { UserRole } from '../projects/types';
import { ProjectsService } from '../projects/projects.service';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new task',
    description: 'Creates a new task in a project. User must be a member of the project or admin.',
  })
  @ApiResponse({ status: 201, description: 'Task successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to this project.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  async createTask(
    @Request() req: RequestWithUser,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    // Check if user has access to the project
    const project = await this.projectsService.project({ id: createTaskDto.projectId });
    const isMember = project.members.some(member => member.id === req.user.userId);
    if (!isMember && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.tasksService.createTask({
      ...createTaskDto,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
      creatorId: req.user.userId,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Get all tasks',
    description: 'Retrieves all tasks assigned to or created by the user. Admins can see all tasks.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus, description: 'Filter by task status' })
  @ApiQuery({ name: 'priority', required: false, enum: Priority, description: 'Filter by task priority' })
  @ApiResponse({ status: 200, description: 'List of tasks retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getTasks(
    @Request() req: RequestWithUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: Priority,
  ) {
    const skip = (page - 1) * limit;
    const where = {
      OR: [
        { assigneeId: req.user.userId },
        { creatorId: req.user.userId },
        ...(req.user.role === UserRole.ADMIN ? [{}] : []),
      ],
      ...(status && { status }),
      ...(priority && { priority }),
    };

    return this.tasksService.tasks({
      skip,
      take: limit,
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a task by id',
    description: 'Retrieves a specific task by ID. User must be a member of the project or admin.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to this task.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async getTask(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    const task = await this.tasksService.task({ id });
    const project = await this.projectsService.project({ id: task.projectId });

    // Check if user has access to the project
    const isMember = project.members.some(member => member.id === req.user.userId);
    if (!isMember && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a task',
    description: 'Updates a specific task. User must be the creator, assignee, or admin.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have permission to update this task.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async updateTask(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.task({ id });
    const project = await this.projectsService.project({ id: task.projectId });

    // Check if user has access to the project
    const isMember = project.members.some(member => member.id === req.user.userId);
    if (!isMember && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this task');
    }

    // Only task creator, assignee, or admin can update the task
    if (task.creatorId !== req.user.userId && 
        task.assigneeId !== req.user.userId && 
        req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have permission to update this task');
    }

    return this.tasksService.updateTask({
      where: { id },
      data: {
        ...updateTaskDto,
        dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : undefined,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a task',
    description: 'Deletes a specific task. Only task creator or admin can delete tasks.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only task creator or admin can delete tasks.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async deleteTask(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    const task = await this.tasksService.task({ id });
    const project = await this.projectsService.project({ id: task.projectId });

    // Check if user has access to the project
    const isMember = project.members.some(member => member.id === req.user.userId);
    if (!isMember && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this task');
    }

    // Only task creator or admin can delete the task
    if (task.creatorId !== req.user.userId && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only task creator or admin can delete tasks');
    }

    return this.tasksService.deleteTask({ id });
  }

  @Get('project/:projectId')
  @ApiOperation({
    summary: 'Get all tasks for a project',
    description: 'Retrieves all tasks in a specific project. User must be a member of the project or admin.',
  })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'List of tasks retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to this project.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  async getTasksByProject(
    @Request() req: RequestWithUser,
    @Param('projectId') projectId: string,
  ) {
    const project = await this.projectsService.project({ id: projectId });

    // Check if user has access to the project
    const isMember = project.members.some(member => member.id === req.user.userId);
    if (!isMember && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.tasksService.getTasksByProject(projectId);
  }

  @Get('assignee/:userId')
  @ApiOperation({
    summary: 'Get all tasks assigned to a user',
    description: 'Retrieves all tasks assigned to a specific user. Users can only view their own tasks unless they are admin.',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'List of tasks retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Users can only view their own assigned tasks.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getTasksByAssignee(
    @Request() req: RequestWithUser,
    @Param('userId') userId: string,
  ) {
    // Users can only view their own assigned tasks unless they're an admin
    if (userId !== req.user.userId && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only view your own assigned tasks');
    }

    return this.tasksService.getTasksByAssignee(userId);
  }

  @Get('creator/:userId')
  @ApiOperation({
    summary: 'Get all tasks created by a user',
    description: 'Retrieves all tasks created by a specific user. Users can only view their own tasks unless they are admin.',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'List of tasks retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Users can only view their own created tasks.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getTasksByCreator(
    @Request() req: RequestWithUser,
    @Param('userId') userId: string,
  ) {
    // Users can only view their own created tasks unless they're an admin
    if (userId !== req.user.userId && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only view your own created tasks');
    }

    return this.tasksService.getTasksByCreator(userId);
  }
} 