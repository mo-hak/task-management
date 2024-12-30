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
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UserRole, ProjectStatus, User } from './types';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new project',
    description: 'Creates a new project and automatically adds the creator as a member.',
  })
  @ApiResponse({ status: 201, description: 'Project successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createProject(
    @Request() req: RequestWithUser,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.createProject({
      ...createProjectDto,
      members: {
        connect: [{ id: req.user.userId }],
      },
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Get all projects',
    description: 'Retrieves all projects that the user has access to. Admins can see all projects.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'status', required: false, enum: ProjectStatus, description: 'Filter by project status' })
  @ApiResponse({ status: 200, description: 'List of projects retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProjects(
    @Request() req: RequestWithUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: ProjectStatus,
  ) {
    const skip = (page - 1) * limit;
    const where = {
      OR: [
        { members: { some: { id: req.user.userId } } },
        ...(req.user.role === UserRole.ADMIN ? [{}] : []),
      ],
      ...(status && { status }),
    };

    return this.projectsService.projects({
      skip,
      take: limit,
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a project by id',
    description: 'Retrieves a specific project by ID. User must be a member or admin.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to this project.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  async getProject(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    const project = await this.projectsService.project({ id });

    // Check if user is a member of the project or is an admin
    const isMember = project.members.some((member: User) => member.id === req.user.userId);
    if (!isMember && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a project',
    description: 'Updates a specific project. User must be a member or admin.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to this project.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  async updateProject(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    const existingProject = await this.projectsService.project({ id });

    // Check if user is a member of the project or is an admin
    const isMember = existingProject.members.some((member: User) => member.id === req.user.userId);
    if (!isMember && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.projectsService.updateProject({
      where: { id },
      data: updateProjectDto,
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a project',
    description: 'Deletes a specific project. Only admins can delete projects.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only administrators can delete projects.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  async deleteProject(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    // Only admins can delete projects
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can delete projects');
    }

    return this.projectsService.deleteProject({ id });
  }

  @Post(':id/members/:userId')
  @ApiOperation({
    summary: 'Add a member to a project',
    description: 'Adds a user as a member to a project. User must be a member or admin.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to add as member' })
  @ApiResponse({ status: 200, description: 'Member added successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to this project.' })
  @ApiResponse({ status: 404, description: 'Project or user not found.' })
  async addMemberToProject(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    const existingProject = await this.projectsService.project({ id });

    // Check if user is a member of the project or is an admin
    const isMember = existingProject.members.some((member: User) => member.id === req.user.userId);
    if (!isMember && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.projectsService.addMemberToProject(id, userId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({
    summary: 'Remove a member from a project',
    description: 'Removes a user from a project. User must be a member or admin.',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  @ApiResponse({ status: 200, description: 'Member removed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to this project.' })
  @ApiResponse({ status: 404, description: 'Project or user not found.' })
  async removeMemberFromProject(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    const existingProject = await this.projectsService.project({ id });

    // Check if user is a member of the project or is an admin
    const isMember = existingProject.members.some((member: User) => member.id === req.user.userId);
    if (!isMember && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Prevent removing the last member
    if (existingProject.members.length === 1) {
      throw new ForbiddenException('Cannot remove the last member from the project');
    }

    // Only admins or the user themselves can remove members
    if (req.user.role !== UserRole.ADMIN && req.user.userId !== userId) {
      throw new ForbiddenException('You do not have permission to remove other members');
    }

    return this.projectsService.removeMemberFromProject(id, userId);
  }
} 