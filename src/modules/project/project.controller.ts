import { Controller, Post, Res, Body, HttpStatus, UseGuards, Request, UseInterceptors, UploadedFile, Get, Param, ParseIntPipe, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProjectService } from './project.service';
import { CreateProjectDTO } from 'src/models/dtos/create-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UserService } from '../user/user.service';
import { ProjectDetailsDTO } from 'src/models/dtos/project-details.dto';
import { LikeService } from './like.service';
import { WsGateway } from 'src/app/gateways/ws/ws.gateway';
import { User } from 'src/helpers/decorators/user.decorator';
import { User as UserEntity } from 'src/models/entities/user.entity';
import { JwtOptionalAuthGuard } from '../auth/guards/jwt-optional.guard';

@Controller('projects')
export class ProjectController {
  constructor (
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
    private readonly likeService: LikeService,
    private readonly wsGateway: WsGateway
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async createProject (
    @Res() res,
    @Request() req,
    @Body() createProjectDTO: CreateProjectDTO,
    @UploadedFile() image,
    @User() user: UserEntity,
  ) {
    createProjectDTO.imageUrl = image.secure_url;
    const project = await this.projectService.createProject(user, createProjectDTO);
    const formattedProjectOutput = ProjectDetailsDTO.fromProjectEntity(project);
    return res.status(HttpStatus.OK).json(formattedProjectOutput);
  }

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  async fetchAllProjects (@Res() res, @User() user?: UserEntity) {
    const projects = await this.projectService.fetchAllProjects();
    const projectsLikesSet = projects.map(project => new Set(project.likes.map(like => like.id)))
    const formattedProjectsOutput = projects.map(project => ProjectDetailsDTO.fromProjectEntity(project));

    if (user) {
      const userLikeds = await this.userService.getLikedProjectsForUser(user.id)
      userLikeds.forEach(like => {
        projectsLikesSet.forEach ((projectLikes, index) => {
          if (projectLikes.has(like.id)) {
            formattedProjectsOutput[index].isLiked = true
          }
        })
      })
    }

    return res.status(HttpStatus.OK).json(formattedProjectsOutput);
  }

  @Get(':projectId')
  async getProject (@Res() res, @Param('projectId', ParseIntPipe) projectId: number) {
    const project = await this.projectService.findProjectById(projectId, ['user']);
    const formattedProjectOutput = ProjectDetailsDTO.fromProjectEntity(project);
    return res.status(HttpStatus.OK).json(formattedProjectOutput);
  }

  @Delete(':projectId')
  @UseGuards(JwtAuthGuard)
  async deleteProject (
    @Res() res,
    @Request() req,
    @Param('projectId', ParseIntPipe) projectId: number
  ) {
    const { user } = req
    const deletedProject = await this.projectService.deleteProject(projectId, user);
    const formattedProjectOutput = ProjectDetailsDTO.fromProjectEntity(deletedProject);
    return res.status(HttpStatus.OK).json(formattedProjectOutput);
  }

  @Post(':projectId/likes')
  @UseGuards(JwtAuthGuard)
  async likeProject (
    @Res() res,
    @Request() req,
    @User() user: UserEntity,
    @Param('projectId', ParseIntPipe) projectId: number
  ) {
    const like = await this.likeService.like(user.id, projectId);
    const projectOwner = like.project.user

    if (projectOwner.id !== user.id) {
      this.wsGateway.ws.emit(`notifications:user:${projectOwner.id}`, { message: `${user.username} liked your project.` });
    }

    return res.status(HttpStatus.OK).json({});
  }

  @Delete(':projectId/likes')
  @UseGuards(JwtAuthGuard)
  async unlikeProject (
    @Res() res,
    @Request() req,
    @User() user: UserEntity,
    @Param('projectId', ParseIntPipe) projectId: number
  ) {
    await this.likeService.unlike(user.id, projectId);
    return res.status(HttpStatus.OK).json({});
  }
}
