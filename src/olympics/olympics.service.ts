import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOlympicsDto } from './dto/CreateOlympicsDto';

@Injectable()
export class OlympicsService {
  constructor(
    private prisma: PrismaService
  ) { }

  async createTask(olympicsId: number){
    try{
      
    }
    catch(error){
      throw new BadRequestException('Ошибка создания задания')
    }
  }

  async getPlannedOlympics(){
    try{
      return await this.prisma.olympics.findMany({
        where: {
          startTime: {
            gte: new Date(),
          }
        }
      })
    }
    catch(error){
      throw new BadRequestException('Ошибка получения олимпиад')
    }
  }

  async getServerTime(){
    try{
      let date = new Date();
      return this.addHours(date, 3)
    }
    catch(error){
      throw new BadRequestException('Ошибка получения текущего времени')
    }
  }

  async addHours(date, hours) {
    date.setHours(date.getHours() + hours);
    return date;
  }

  async getCurrentOlympics(){
    try{
      return await this.prisma.olympics.findMany({
        where: {
          startTime: {
            gte: new Date(),
          },
          endTime: {
            lte: new Date()
          }
        }
      })
    }
    catch(error){
      throw new BadRequestException('Ошибка получения олимпиад')
    }
  }

  async getFinishedOlympics(){
    try{
      return await this.prisma.olympics.findMany({
        where: {
          endTime: {
            lte: new Date(),
          }
        }
      })
    }
    catch(error){
      throw new BadRequestException('Ошибка получения олимпиад')
    }
  }

  async getAllOlympics(){
    try{
      await this.prisma.olympics.findMany({
        
      })
    }
    catch(error){
      throw new BadRequestException('Ошибка получения всех олимпиад')
    }
  }

  async getOlympicsById(id: number){
    try{
      return await this.prisma.olympics.findUnique({
        where: {
          id: id
        }
      })
    }
    catch(error){
      throw new BadRequestException(`Ошибка получения олимпиады с id = ${id}`)
    }
  }

  async createOlympics(createOlympicsDto: CreateOlympicsDto){
    try{
      return await this.prisma.olympics.create({
        data: {
            creatorId: createOlympicsDto.creatorId,
            name: createOlympicsDto.name,
            description: createOlympicsDto.description,
            startTime: createOlympicsDto.startTime,
            endTime: createOlympicsDto.endTime,
            databaseScript: createOlympicsDto.databaseScript,
            image: createOlympicsDto.image
        }
      })
    }
    catch(error){
      console.log(error)
      throw new BadRequestException('Произошла ошибка при создании олимпиады')
    }
  }

  async deleteOlympics(id: number){
    try{
      return await this.prisma.olympics.delete({
        where: {
          id: id
        }
      })
    }
    catch(error){
      throw new BadRequestException('Произошла ошибка при удалении олимпиады')
    }
  }
}