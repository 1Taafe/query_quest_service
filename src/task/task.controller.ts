import {Body, Controller, Get, Put, HttpStatus, Post, Delete, Request, UseGuards, Param, ParseIntPipe, Req} from '@nestjs/common';
import { TaskService } from './task.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { Role } from 'src/auth/Role';
import { RoleGuard } from 'src/auth/role.guard';
import { Roles } from 'src/auth/role.decorator';
import { CreateTaskDto } from './dto/CreateTaskDto';
import { UpdateTaskDto } from './dto/UpdateTaskDto';
import { UserQueryDto } from './dto/UserQueryDto';



@Controller('/olympics')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @UseGuards(AuthGuard)
  @Get('/tasks/:id')
  async getOlympicsTask(@Param('id', ParseIntPipe) taskId: number){
    return this.taskService.getOlympicsTask(taskId);
  }

  @UseGuards(AuthGuard)
  @Get(':id/tasks')
  async getOlympicsTasks(@Request() request, @Param('id', ParseIntPipe) id: number){
    if(request.user.role === Role.Organizer){
      return this.taskService.getOlympicsTasks(id, request.user.sub);
    }
    else{
      return this.taskService.getOlympicsTasksAsUser(id);
    }
  }

  @UseGuards(RoleGuard)
  @Roles(Role.User)
  @Get('/tasks/:id')
  async getTaskById(@Param('id', ParseIntPipe) id: number){
    return this.taskService.getOlympicsTask(id)
  }

  @UseGuards(RoleGuard)
  @Roles(Role.User)
  @Post('/tasks/:id/check')
  async checkTask(@Param('id', ParseIntPipe) id: number, @Request() request,  @Body() userQueryDto: UserQueryDto){
    userQueryDto.taskId = id
    userQueryDto.userId = request.user.sub
    return this.taskService.executeQueryAsUser(userQueryDto)
  }

  @UseGuards(RoleGuard)
  @Roles(Role.Organizer)
  @Delete('/task/:taskId')
  async deleteOlympicsTask(@Request() request, @Param('taskId', ParseIntPipe) taskId: number){
    return this.taskService.deleteTask(taskId, request.user.sub);
  }

  @UseGuards(RoleGuard)
  @Roles(Role.Organizer)
  @Post('/task')
  async createOlympicsTask(@Request() request, @Body() createTaskDto: CreateTaskDto){
    createTaskDto.creatorId = request.user.sub
    return this.taskService.createOlympicsTask(createTaskDto);
  }

  @UseGuards(RoleGuard)
  @Roles(Role.Organizer)
  @Put('/task/:taskId')
  async updateOlympicsTask(@Request() request, @Param('taskId', ParseIntPipe) taskId: number, @Body() updateTaskDto: UpdateTaskDto){
    updateTaskDto.id = taskId
    updateTaskDto.creatorId = request.user.sub
    return this.taskService.updateTask(updateTaskDto)
  }
  
}
