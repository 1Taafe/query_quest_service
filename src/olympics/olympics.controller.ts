import {Body, Controller, Get, Put, HttpStatus, Post, Delete, Request, UseGuards, Param, ParseIntPipe, Req} from '@nestjs/common';
import { OlympicsService } from './olympics.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateOlympicsDto } from './dto/CreateOlympicsDto';
import { RoleGuard } from 'src/auth/role.guard';
import { Roles } from 'src/auth/role.decorator';
import { Role } from 'src/auth/Role';
import { CreateTaskDto } from '../task/dto/CreateTaskDto';
import { UpdateTaskDto } from '../task/dto/UpdateTaskDto';
import { QueryDto } from './dto/QueryDto';
import { UserQueryDto } from '../task/dto/UserQueryDto';
import { UpdateOlympicsDto } from './dto/UpdateOlympicsDto';


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
  @Put('/:id')
  async updateOlympics(@Param('id', ParseIntPipe) id: number, @Request() request, @Body() updateOlympicsDto: UpdateOlympicsDto){
    updateOlympicsDto.id = id;
    updateOlympicsDto.creatorId = request.user.sub
    return this.olympicsService.updateOlympics(updateOlympicsDto)
  }

  @UseGuards(RoleGuard)
  @Roles(Role.Organizer)
  @Delete('/:id')
  async deleteOlympics(@Param('id', ParseIntPipe) id: number, @Request() request,){
    const creatorId = request.user.sub
    return this.olympicsService.deleteOlympics(id, creatorId)
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
    return this.olympicsService.getOlympicsById(id)
  }

  @UseGuards(RoleGuard)
  @Roles(Role.User)
  @Get('tasks/:id/answer')
  async getAnswer(@Param('id', ParseIntPipe) id: number, @Request() request){
    return this.olympicsService.getUserAnswer(id, request.user.sub)
  }

  @UseGuards(RoleGuard)
  @Roles(Role.Organizer)
  @Post('/:id')
  async executeQuery(@Param('id', ParseIntPipe) id: number, @Request() request, @Body() queryDto: QueryDto){
    queryDto.olympicsId = id
    queryDto.userId = request.user.sub
    return this.olympicsService.executeQuery(queryDto)
  }

  @UseGuards(RoleGuard)
  @Roles(Role.User, Role.Organizer)
  @Get('/:id/results')
  async getUserResults(@Param('id', ParseIntPipe) id: number, @Request() request){
    if(request.user.role == Role.User){
      return this.olympicsService.getResults(id, request.user.sub);
    }
    else if(request.user.role == Role.Organizer){
      return this.olympicsService.getOrganizerResults(id);
    }
  }

  @UseGuards(RoleGuard)
  @Roles(Role.User)
  @Get('/:id/answers')
  async getUserAnswers(@Param('id', ParseIntPipe) id: number, @Request() request){
    return this.olympicsService.getUserAnswers(id, request.user.sub)
  }
}
