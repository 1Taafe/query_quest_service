import {Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login.user.dto';
import { SignupUserDto } from './dto/signup.user.dto';
import { RoleGuard } from './role.guard';
import { AuthGuard } from './auth.guard';

@Controller('/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  signIn(@Body() loginUserDto : LoginUserDto) {
    return this.authService.login(loginUserDto.email, loginUserDto.password);
  }

  @Post('/signup')
  async signup(@Body() signupUserDto: SignupUserDto){
    const signupUser = await this.authService.signUp(signupUserDto);
    return signupUser;
  }

  @UseGuards(AuthGuard)
  @Get('/checkToken')
  async checkToken(@Request() req){
    return await this.authService.checkToken(req.user.role);
  }

  @UseGuards(AuthGuard)
  @Get('/profile')
  async getProfile(@Request() req) {
    return await this.authService.getUserProfile(req.user.sub);
  }

//   @Post('/register')
//   async register(@Body() createUserDto: CreateUserDto){
//     createUserDto.role = 'passenger'
//     createUserDto.company = 'None'
//     const createdUser = await this.authService.createUser(createUserDto);
//     return createdUser;
//   }

//   @UseGuards(RoleGuard)
//   @Roles('admin', 'manager')
//   @Post('/createDriver')
//   async createDriver(@Body() createUserDto: CreateUserDto){
//     const createdUser = await this.authService.createUser(createUserDto);
//     return createdUser;
//   }

//   @UseGuards(RoleGuard)
//   @Roles('admin')
//   @Post('/createUser')
//   async createUser(@Body() createUserDto: CreateUserDto){
//     const createdUser = await this.authService.createUser(createUserDto);
//     return createdUser;
//   }

  // @UseGuards(RoleGuard)
  // @Roles('admin')
  // @Get('profile')
  // getProfile(@Request() req) {
  //   return req.user;
  // }

}