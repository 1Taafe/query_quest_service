import {Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards} from '@nestjs/common';
import { OlympicsService } from './olympics.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateOlympicsDto } from './dto/CreateOlympicsDto';
import { RoleGuard } from 'src/auth/role.guard';
import { Roles } from 'src/auth/role.decorator';
import { Role } from 'src/auth/Role';


@Controller('/olympics')
export class OlympicsController {
  constructor(private olympicsService: OlympicsService) {}

  // @UseGuards(RoleGuard)
  // @Roles(Role.Organizer)
  // @Get('/info')
  // async getInfo(@Request() req){
  //   return req.user
  // }

  @UseGuards(RoleGuard)
  @Roles(Role.Organizer)
  @Post('/create')
  async createOlympics(@Request() req, @Body() createOlympicsDto: CreateOlympicsDto) {
    createOlympicsDto.creatorId = req.user.sub
    return this.olympicsService.createOlympics(createOlympicsDto)
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
}
