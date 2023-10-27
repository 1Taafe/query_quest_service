import { BadRequestException, Injectable, NotAcceptableException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOlympicsDto } from './dto/CreateOlympicsDto';
import { CreateTaskDto } from './dto/CreateTaskDto';
import { Client } from 'pg';

@Injectable()
export class OlympicsService {
  constructor(
    private prisma: PrismaService
  ) { }

  async getOlympicsTasks(olympicsId: number){
    try{
      return await this.prisma.task.findMany({
        where: {
          olympicsId: olympicsId
        },
        orderBy: {
          id: 'desc'
        }
      })
    }
    catch(error){
      console.log(error.toString())
      throw new BadRequestException('Ошибка получения заданий олимпиады')
    }
  }

  async createOlympicsTask(createTaskDto: CreateTaskDto){
    const olympics = await this.prisma.olympics.findUnique({
      where: {
        id: createTaskDto.olympicsId
      }
    });
    if(createTaskDto.creatorId != olympics.creatorId){
      throw new BadRequestException();
    }
    try{
      await this.prisma.task.create({
        data: {
          olympicsId: createTaskDto.olympicsId,
          title: createTaskDto.title,
          solution: createTaskDto.solution,
          image: createTaskDto.image,
        }
      })
      return {
        message: 'Задание создано'
      }
    }
    catch(error){
      throw new BadRequestException('Ошибка создания задания')
    }
  }

  async deleteTask(id: number, creatorId: number){
    const task = await this.prisma.task.findUnique({
      where: {
        id: id
      },
      include: {
        olympics: true
      }
    })
    const olympics = await this.prisma.olympics.findUnique({
      where: {
        id: task.olympicsId
      }
    });
    if(creatorId != olympics.creatorId){
      throw new BadRequestException();
    }
    try{
      await this.prisma.task.delete({
        where: {
          id: id
        }
      })
      return {
        message: 'Задание удалено'
      }
    }
    catch(error){
      throw new BadRequestException('Ошибка удаления задания')
    }
  }

  async getPlannedOlympics(){
    try{
      const olympics = await this.prisma.olympics.findMany({
        where: {
          startTime: {
            gte: new Date(),
          }
        },
        include: {
          creator: true
        }
      })
      const filteredOlympics = olympics.map(olympics => {
        return {
          ...olympics,
          creator: {
            ...olympics.creator,
            password: '<hidden>'
          }
        }
      })
      return filteredOlympics
    }
    catch(error){
      throw new BadRequestException('Ошибка получения олимпиад')
    }
  }

  async getCurrentOlympics(){
    try{
      const olympics = await this.prisma.olympics.findMany({
        where: {
          startTime: {
            gte: new Date(),
          },
          endTime: {
            lte: new Date()
          }
        },
        include: {
          creator: true
        }
      })
      const filteredOlympics = olympics.map(olympics => {
        return {
          ...olympics,
          creator: {
            ...olympics.creator,
            password: '<hidden>'
          }
        }
      })
      return filteredOlympics
    }
    catch(error){
      throw new BadRequestException('Ошибка получения олимпиад')
    }
  }

  async getFinishedOlympics(){
    try{
      const olympics = await this.prisma.olympics.findMany({
        where: {
          endTime: {
            lte: new Date(),
          }
        },
        include: {
          creator: true
        }
      })
      const filteredOlympics = olympics.map(olympics => {
        return {
          ...olympics,
          creator: {
            ...olympics.creator,
            password: '<hidden>'
          }
        }
      })
      return filteredOlympics
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
      const olympics = await this.prisma.olympics.findUnique({
        where: {
          id: id
        },
        include: {
          creator: true
        }
      })
      olympics.creator.password = '<hidden>'
      return olympics
    }
    catch(error){
      throw new BadRequestException(`Ошибка получения олимпиады с id = ${id}`)
    }
  }

  async createOlympics(createOlympicsDto: CreateOlympicsDto){
    let createPostgreClient
    let postgreClient
    try{
      //Создание базы данных олимпиады по названию
      createPostgreClient = new Client({
        host: 'localhost',
        port: 5433,
        database: 'postgres',
        user: 'postgres',
        password: 'admin',
      })
      await createPostgreClient.connect();
      await createPostgreClient.query(`CREATE DATABASE ${createOlympicsDto.databaseName}`);
      
      //Выполнение скрипта создания всех объектов бд
      postgreClient = new Client({
        host: 'localhost',
        port: 5433,
        database: createOlympicsDto.databaseName,
        user: 'postgres',
        password: 'admin',
      })
      await postgreClient.connect();
      await postgreClient.query(createOlympicsDto.databaseScript);

      return await this.prisma.olympics.create({
        data: {
            creator: {
              connect: {
                id: createOlympicsDto.creatorId
              }
            },
            name: createOlympicsDto.name,
            description: createOlympicsDto.description,
            startTime: createOlympicsDto.startTime,
            endTime: createOlympicsDto.endTime,
            databaseScript: createOlympicsDto.databaseScript,
            databaseName: createOlympicsDto.databaseName,
            image: createOlympicsDto.image
        }
      })
    }
    catch(error){
      console.log(error)
      const errorMessage : string = error.toString();
      if(errorMessage.includes('already exists')){
        throw new BadRequestException('База данных с таким именем уже существует')
      }
      else{
        throw new BadRequestException('Произошла ошибка при создании олимпиады')
      }
    }
    finally{
      if(postgreClient !== undefined){
        await postgreClient.end()
      }
      if(createPostgreClient !== undefined){
        await createPostgreClient.end()
      }
    }
  }

  async deleteOlympics(id: number, creatorId: number){
    let postgreClient
    try{
      const olympics = await this.prisma.olympics.findUnique({
        where: {
          id: id
        }
      });
      if(olympics.creatorId != creatorId){
        throw new BadRequestException('Невозможно удалить олимпиаду, поскольку вы не являетесь ее владельцем')
      }
      postgreClient = new Client({
        host: 'localhost',
        port: 5433,
        database: 'postgres',
        user: 'postgres',
        password: 'admin',
      })
      await postgreClient.connect();
      await postgreClient.query(`DROP DATABASE ${olympics.databaseName}`);
      await this.prisma.olympics.delete({
        where: {
          id: id
        }
      })
      return {
        message: 'Олимпиада успешно удалена'
      }
    }
    catch(error){
      const errorMessage: string = error.toString()
      if(errorMessage.includes('does not exist')){
        await this.prisma.olympics.delete({
          where: {
            id: id
          }
        })
        return {
          message: 'Информация об олимпиаде успешно удалена'
        }
      }
      else if(errorMessage.includes('is being accessed by other users')){
        throw new NotAcceptableException('Не удалось удалить олимпиаду поскольку база данных используется в данный момент')
      }
      console.log(error)
      throw new BadRequestException('Произошла ошибка при удалении олимпиады')
    }
    finally{
      if(postgreClient !== undefined){
        await postgreClient.end()
      }
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
}