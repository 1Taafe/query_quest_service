import { BadRequestException, Injectable, NotAcceptableException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOlympicsDto } from './dto/CreateOlympicsDto';
import { CreateTaskDto } from './dto/CreateTaskDto';
import { Client } from 'pg';
import { UpdateTaskDto } from './dto/UpdateTaskDto';
import { QueryDto } from './dto/QueryDto';
import { json2csv } from 'json-2-csv';
import { UserQueryDto } from './dto/UserQueryDto';
import { Role } from 'src/auth/Role';

@Injectable()
export class OlympicsService {
  constructor(
    private prisma: PrismaService
  ) { }

  disabledSqlCommands = ['create', 'alter', 'drop', 'insert', 'update', 'delete', 'truncate', 'grant', 'revoke']

  async getUserAnswers(olympicsId: number, userId: number){
    try{
      const answers = await this.prisma.answer.findMany({
        where: {
          task: {
            olympicsId: olympicsId
          },
          userId: userId
        }
      })
      return answers;
    }
    catch(error){
      throw new BadRequestException(error.message)
    }
  }

  async getOrganizerResults(olympicsId: number){
    try{
      const users = await this.prisma.user.findMany({
        where: {
          role: {
            name: Role.User
          }
        }
      })
      const filteredUsers = users.map(user => {
        return {
          ...user,
          password: '<hidden>'
        }
      })
      const result = await this.prisma.answer.groupBy({
        by: ['userId'],
        _sum: { score: true },
        _max: { time: true },
        where: {
          task: {
            olympicsId: olympicsId,
          },
        },
        orderBy: [
          { _sum: { score: 'desc' } },
          { _max: { time: 'asc' } },
        ],
      });
      let index = 0;
      let results = result.map((userResult) => {
        index++
        return {
          ...userResult,
          place: index,
          user: filteredUsers.find(user => user.id == userResult.userId)
        }
      })
      return results
    }
    catch(error){
      throw new BadRequestException(error.message)
    }
  }

  async getResults(olympicsId: number, userId: number){
    try{
      const result = await this.prisma.answer.groupBy({
        by: ['userId'],
        _sum: { score: true },
        _max: { time: true },
        where: {
          task: {
            olympicsId: olympicsId,
          },
        },
        orderBy: [
          { _sum: { score: 'desc' } },
          { _max: { time: 'asc' } },
        ],
      });
      let index = 0;
      let results = result.map((userResult) => {
        index++
        return {
          ...userResult,
          place: index
        }
      })
      const finalResult = results.find(result => result.userId == userId)
      return finalResult
    }
    catch(error){
      throw new BadRequestException(error.message)
    }
  }

  async getUserAnswer(taskId: number, userId: number){
    try{
      const answer = await this.prisma.answer.findFirst({
        where: {
          taskId: taskId,
          userId: userId,
        }
      })
      return answer
    }
    catch(error){
      throw new BadRequestException(error.message)
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

  async executeQuery(queryDto: QueryDto){
    let postgreClient
    try{
      for(const command of this.disabledSqlCommands){
        if(queryDto.query.includes(command)){
          throw new BadRequestException('Выполнение данной команды недоступно')
        }
      }
      const olympics = await this.prisma.olympics.findUnique({
        where: {
          id: queryDto.olympicsId
        }
      })
      if(olympics.creatorId !== queryDto.userId){
        throw new BadRequestException('У вас нет прав на выполнение операции')
      }
      postgreClient = new Client({
        host: 'localhost',
        port: 5433,
        database: olympics.databaseName,
        user: 'postgres',
        password: 'admin',
      })
      await postgreClient.connect();
      const result = await postgreClient.query(queryDto.query);
      return {
        result: json2csv(result.rows)
      }
    }
    catch(error){
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
        return await this.prisma.task.findMany({
          where: {
            olympicsId: olympicsId
          },
          orderBy: {
            id: 'asc'
          }
        })
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

  async getPlannedOlympics(){
    try{
      const currentDate = await this.getServerTime()
      const olympics = await this.prisma.olympics.findMany({
        where: {
          startTime: {
            gte: currentDate,
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
      const currentDate = await this.getServerTime()
      const olympics = await this.prisma.olympics.findMany({
        where: {
          startTime: {
            lte: currentDate,
          },
          endTime: {
            gte: currentDate
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
      const currentDate = await this.getServerTime()
      const olympics = await this.prisma.olympics.findMany({
        where: {
          endTime: {
            lte: currentDate,
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
      let isAccessed
      const olympics = await this.prisma.olympics.findUnique({
        where: {
          id: id,
        },
        include: {
          creator: true
        }
      })
      olympics.creator.password = '<hidden>'
      const currentDate : Date = await this.getServerTime();
      const currentTime = currentDate.getTime();
      if(olympics.startTime.getTime() <= currentTime && olympics.endTime.getTime() >= currentTime){
        isAccessed = true
      }
      else{
        isAccessed = false
      }
      if(olympics.endTime.getTime() <= currentTime){
        return {
          ...olympics,
          isAccessed: isAccessed,
          isFinished: true
        }
      }
      else{
        return {
          ...olympics,
          isAccessed: isAccessed,
          isFinished: false
        }
      }
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