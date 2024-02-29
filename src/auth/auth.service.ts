import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { SignupUserDto } from './dto/signup.user.dto';
import { Role } from './Role'
import { ProfileUserDto } from './dto/profile.user.dto';
import * as argon2 from 'argon2';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ChangePasswordDto } from './dto/change.password.dto';
import { MailerService } from 'src/mailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailer: MailerService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) { }

  async restorePasswordRequest(email: string){
    try{
      const user = await this.prisma.user.findFirst({
        where: {
          email: email
        }
      })
      const restorePasswordCode = Math.floor(100000 + Math.random() * 900000);
      await this.cacheService.set(user.email, restorePasswordCode)
      await this.mailer.send('QueryQuest - Восстановление пароля', `Ваш код для восстановления пароля: ${restorePasswordCode}. Не передавайте его третьим лицам!`)
      return {
        "message": "Запрос успешно зарегистрирован"
      }
    }
    catch(error){
      throw new BadRequestException('Учетная запись с данным адресом не найдена')
    }
  }

  async isRestoreCodeValid(email: string, code: string){
    const restoreCode = await this.cacheService.get(email);
    if(restoreCode == code){
      return {
        "message": "Код верный"
      }
    }
    else{
      throw new BadRequestException('Код неверный')
    }
  }

  async restorePassword(changePasswordDto: ChangePasswordDto){
    if(changePasswordDto.password.length < 8){
      throw new BadRequestException('Пароль должен быть больше 8 символов')
    }
    if(await this.isRestoreCodeValid(changePasswordDto.email, changePasswordDto.code)){
      await this.cacheService.del(changePasswordDto.email)
      await this.prisma.user.update({
        where: {
          email: changePasswordDto.email
        },
        data: {
          password: await argon2.hash(changePasswordDto.password)
        }
      })
      return {
        "message": 'Пароль был успешно изменен'
      }
    }
    else{
      throw new BadRequestException('Неверный код')
    }
    
  }

  async checkToken(role: string){
    return {
      'status': 'Авторизация по токену успешно выполнена',
      'role': role
    }
  }

  async login(email, password) {
    try {
      const user = await this.findOne(email);
      if (!(await argon2.verify(user?.password, password))) {
        throw new BadRequestException('Неверные адрес электронной почты и/или пароль');
      } 
      const payload = {
        sub: user.id,
        role: user.role?.name
      };
      return {
        access_token: await this.jwtService.signAsync(payload),
        status: 'Авторизация успешно выполнена',
        role: payload.role
      };
    }
    catch (error) {
      throw new BadRequestException('Неверные адрес электронной почты и/или пароль')
    }

  }

  async getUserProfile(userId: number){
    try{
      const userInfo = await this.prisma.user.findUnique({
        where: {
          id: userId
        },
        include: {
          role: true
        }
      })
      const user: ProfileUserDto = {
        email: userInfo.email,
        course: userInfo.course,
        group: userInfo.group,
        surname: userInfo.surname,
        name: userInfo.name,
        phone: userInfo.phone,
        role: userInfo.role.name
      }
      return user
    }
    catch(error){

    }
  }

  async signUp(signupUserDto: SignupUserDto): Promise<any> {
    try {
      const passwordHash = await argon2.hash(signupUserDto.password)
      if(signupUserDto.surname.length <= 2 || signupUserDto.name.length <= 2 ){
        throw new BadRequestException('Фамилия и имя должны быть больше 2 символов')
      }
      if(!await this.isEmailValid(signupUserDto.email)){
        throw new BadRequestException('Неверный формат Email адреса')
      }
      if(signupUserDto.password.length < 8){
        throw new BadRequestException('Пароль должен быть больше 8 символов')
      }
      const user = await this.prisma.user.create({
        data: {
          email: signupUserDto.email,
          password: passwordHash,
          surname: signupUserDto.surname,
          name: signupUserDto.name,
          phone: signupUserDto.phone,
          course: signupUserDto.course,
          group: signupUserDto.group,
          role: {
            connectOrCreate: {
              where: {
                name: Role.User
              },
              create: {
                name: Role.User
              }
            }
          }
        }
      })
      const signupUser: SignupUserDto = {
        email: user.email,
        password: '<hidden>',
        course: user.course,
        group: user.group,
        surname: user.surname,
        name: user.name,
        phone: user.phone
      }
      return signupUser
    }
    catch (error) {
      console.log(error)
      if(error.toString().includes('Unique constraint failed')){
        throw new BadRequestException('Пользователь с такими данными уже существует')
      }
      else if(error.toString().includes('Email')){
        throw new BadRequestException('Неверный формат Email адреса')
      }
      else{
        throw new BadRequestException(error.message)
      }
      
    }
  }

  async findOne(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email: email
      },
      include: { role: true },
    })
  }

  async isEmailValid(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

}