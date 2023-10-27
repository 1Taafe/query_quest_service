import {Body, Controller, Get, HttpCode, HttpStatus, Post, Delete, Request, UseGuards, Param, ParseIntPipe} from '@nestjs/common';
import { OlympicsService } from './olympics.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateOlympicsDto } from './dto/CreateOlympicsDto';
import { RoleGuard } from 'src/auth/role.guard';
import { Roles } from 'src/auth/role.decorator';
import { Role } from 'src/auth/Role';
import { CreateTaskDto } from './dto/CreateTaskDto';


@Controller('/olympics')
export class OlympicsController {
  constructor(private olympicsService: OlympicsService) {}

  @UseGuards(RoleGuard)
  @Roles(Role.Organizer)
  @Post('/create')
  async createOlympics(@Request() request, @Body() createOlympicsDto: CreateOlympicsDto) {
    createOlympicsDto.creatorId = request.user.sub
    return this.olympicsService.createOlympics(createOlympicsDto)
  }

  @UseGuards(RoleGuard)
  @Roles(Role.Organizer)
  @Delete('/:id')
  async deleteOlympics(@Param('id', ParseIntPipe) id: number, @Request() request,){
    const creatorId = request.user.sub
    return this.olympicsService.deleteOlympics(id, creatorId)
  }

  @UseGuards(AuthGuard)
  @Get(':id/tasks')
  async getOlympicsTasks(@Param('id', ParseIntPipe) id: number){
    return this.olympicsService.getOlympicsTasks(id);
  }

  @UseGuards(RoleGuard)
  @Roles(Role.Organizer)
  @Delete('/task/:taskId')
  async deleteOlympicsTask(@Request() request, @Param('taskId', ParseIntPipe) taskId: number){
    return this.olympicsService.deleteTask(taskId, request.user.sub);
  }

  @UseGuards(RoleGuard)
  @Roles(Role.Organizer)
  @Post('/task')
  async createOlympicsTask(@Request() request, @Body() createTaskDto: CreateTaskDto){
    createTaskDto.creatorId = request.user.sub
    return this.olympicsService.createOlympicsTask(createTaskDto);
  }

  @UseGuards(AuthGuard)
  @Get('/all')
  async getAllOlympics(){
    return this.olympicsService.getAllOlympics()
  }

  @UseGuards(AuthGuard)
  @Get('/planned')
  async getPlannedOlympics(){
    return this.olympicsService.getPlannedOlympics()
  }

  @UseGuards(AuthGuard)
  @Get('/current')
  async getCurrentOlympics(){
    return this.olympicsService.getCurrentOlympics()
  }

  @UseGuards(AuthGuard)
  @Get('/finished')
  async getFinishedOlympics(){
    return this.olympicsService.getFinishedOlympics()
  }

  @Get('/currentTime')
  async getServerTime(){
    return this.olympicsService.getServerTime()
  }

  @UseGuards(AuthGuard)
  @Get('/:id')
  async getOlympics(@Param('id', ParseIntPipe) id: number){
    return this.olympicsService.getOlympicsById(id);
  }
}
