import { BadRequestException, Injectable, NotAcceptableException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateTaskDto } from './dto/CreateTaskDto';
import { UpdateTaskDto } from './dto/UpdateTaskDto';
import { UserQueryDto } from './dto/UserQueryDto';
import { json2csv } from 'json-2-csv';
import { Client } from 'pg'


@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService
  ) { }

  disabledSqlCommands = ['create', 'alter', 'drop', 'insert', 'update', 'delete', 'truncate', 'grant', 'revoke']

  async getOlympicsTask(taskId: number){
    try{
      const task = await this.prisma.task.findUnique({
        where: {
          id: taskId
        }
      })
      const olympics = await this.prisma.olympics.findUnique({
        where: {
          id: task.olympicsId
        }
      })
      const currentTime = await this.getServerTime()
      if(olympics.startTime.getTime() >= currentTime){
        throw new BadRequestException('Задание невозможно получить до начала олимпиады')
      }
      task.solution = '<Решение скрыто>'
      return task
    }
    catch(error){
      const errorMessage : string = error.message.toString()
      if(errorMessage.includes('начала')){
        throw new BadRequestException('Задание невозможно получить до начала олимпиады')
      }
      else{
        throw new BadRequestException('Ошибка при получении задания')
      }
    }
  }

  async getOlympicsTasksAsUser(olympicsId: number){
    try{
      const currentDate : Date = await this.getServerTime();
      const currentTime = currentDate.getTime();
      const olympics = await this.prisma.olympics.findUnique({
        where: {
          id: olympicsId
        }
      })
      if(olympics.startTime.getTime() <= currentTime && olympics.endTime.getTime() >= currentTime){
        const tasks = await this.prisma.task.findMany({
          where: {
            olympicsId: olympicsId
          },
          orderBy: {
            id: 'asc'
          }
        })
        const filteredTasks = tasks.map(task => {
          return {
            ...task,
            solution: '<Решение скрыто>'
          }
        })
        return filteredTasks
      }
      else {
        throw new BadRequestException('Задания недоступны до начала олимпиады')
      }
    }
    catch(error){
      throw new BadRequestException(error.message)
    }
  }

  async getOlympicsTasks(olympicsId: number, userId: number){
    try{
      const tasks = await this.prisma.task.findMany({
        where: {
          olympicsId: olympicsId
        },
        orderBy: {
          id: 'desc'
        }
      })
      const olympics = await this.prisma.olympics.findUnique({
        where: {
          id: olympicsId
        }
      })
      if(olympics.creatorId === userId){
        return tasks
      }
      else{
        const filteredTasks = tasks.map(task => {
          return {
            ...task,
            title: '<Задание скрыто>',
            solution: '<Решение скрыто>'
          }
        })
        return filteredTasks
      }
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
      throw new BadRequestException('У вас нет прав для выполнения операции');
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

  async updateTask(updateTaskDto: UpdateTaskDto){
    try{
      const task = await this.prisma.task.findUnique({
        where: {
          id: updateTaskDto.id
        }
      })
      const olympics = await this.prisma.olympics.findUnique({
        where: {
          id: task.olympicsId
        }
      })
      if(olympics.creatorId !== updateTaskDto.creatorId){
        throw new BadRequestException('Отсутвуют права на изменение задания')
      }
      const updatedTask = await this.prisma.task.update({
        where: {
          id: updateTaskDto.id
        },
        data: {
          title: updateTaskDto.title,
          solution: updateTaskDto.solution
        }
      })
      return {
        message: 'Задание изменено'
      }
    }
    catch(error){
      throw new BadRequestException(error.message);
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
      throw new BadRequestException('У вас нет прав для выполнения операции');
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

  async executeQueryAsUser(userQueryDto: UserQueryDto){
    let postgreClient
    try{
      for(const command of this.disabledSqlCommands){
        if(userQueryDto.query.includes(command)){
          throw new BadRequestException('Выполнение данной команды недоступно')
        }
      }
      const task = await this.prisma.task.findUnique({
        where: {
          id:userQueryDto.taskId
        }
      })
      const olympics = await this.prisma.olympics.findUnique({
        where: {
          id: task.olympicsId
        }
      })
      postgreClient = new Client({
        host: 'localhost',
        port: 5433,
        database: olympics.databaseName,
        user: 'postgres',
        password: 'admin',
      })
      await postgreClient.connect();
      const result = await postgreClient.query(userQueryDto.query);
      const answer = await this.prisma.answer.findFirst({
        where: {
          userId: userQueryDto.userId,
          taskId: userQueryDto.taskId,
        }
      })
      const resultInCSV = json2csv(result.rows)
      if(resultInCSV.includes(task.solution)){
        if(answer === null){
          await this.prisma.answer.create({
            data: {
              taskId: userQueryDto.taskId,
              userId: userQueryDto.userId,
              query: userQueryDto.query,
              result: resultInCSV,
              score: 1,
              time: await this.getServerTime()
            }
          })
        }
        else{
          await this.prisma.answer.update({
            where: {
              id: answer.id
            },
            data: {
              taskId: userQueryDto.taskId,
              userId: userQueryDto.userId,
              query: userQueryDto.query,
              result: resultInCSV,
              score: 1,
              time: await this.getServerTime()
            }
          })
        }
      }
      else{
        if(answer === null){
          await this.prisma.answer.create({
            data: {
              taskId: userQueryDto.taskId,
              userId: userQueryDto.userId,
              query: userQueryDto.query,
              result: resultInCSV,
              score: 0,
              time: await this.getServerTime()
            }
          })
        }
        else{
          await this.prisma.answer.update({
            where: {
              id: answer.id
            },
            data: {
              taskId: userQueryDto.taskId,
              userId: userQueryDto.userId,
              query: userQueryDto.query,
              result: resultInCSV,
              score: 0,
              time: await this.getServerTime()
            }
          })
        }
      }
      return {
        message: 'Ответ сохранен'
      }
    }
    catch(error){
      console.log(error)
      if(error.message.includes('connect')){
        throw new ServiceUnavailableException('Отсутствует соединение с сервером базы данных')
      }
      throw new BadRequestException(error.message)
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
      return await this.addHours(date, 3)
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