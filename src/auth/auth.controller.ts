import {Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Request, UseGuards} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login.user.dto';
import { SignupUserDto } from './dto/signup.user.dto';
import { RoleGuard } from './role.guard';
import { AuthGuard } from './auth.guard';
import { MailerService } from 'src/mailer/mailer.service';
import { ChangePasswordDto } from './dto/change.password.dto';

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

  @Get('restorePasswordRequest')
  async restorePasswordRequest(@Query('email') email: string){
    return await this.authService.restorePasswordRequest(email);
  }

  @Get('checkRestoreCode')
  async checkRestoreCode(@Query('email') email: string, @Query('code') code: string){
    return await this.authService.isRestoreCodeValid(email, code)
  }

  @Post('restorePassword')
  async restorePasswotd(@Body() changePasswordDto: ChangePasswordDto ){
    return await this.authService.restorePassword(changePasswordDto)
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

}