import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { SignupUserDto } from './dto/signup.user.dto';
import { Role } from './Role'
import { ProfileUserDto } from './dto/profile.user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService
  ) { }

  async checkToken(role: string){
    return {
      'status': 'Авторизация по токену успешно выполнена',
      'role': role
    }
  }

  async login(email, password) {
    try {
      const user = await this.findOne(email);
      // if (user?.password !== password) {
      //   throw new BadRequestException('Неверные адрес электронной почты и/или пароль');
      // }
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
      else{
        throw new BadRequestException('В запросе отсутствуют все данные для регистрации')
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

}