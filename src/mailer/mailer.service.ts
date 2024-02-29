import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import * as argon2 from 'argon2';
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailerService {
  constructor(
  ) { }

  transporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    auth: {
        user: 'dima759mi@mail.ru',
        pass: 'C3Nycs89TXQkAT9MAWue',
    },
    })

  async send(subject: string, content: string){
    let result = await this.transporter.sendMail({
        from: 'dima759mi@mail.ru',
        to: 'dima759mi@gmail.com',
        subject: subject,
        text: 'Данное письмо было отправлено с помощью сервиса QueryQuest и является служебным. Не передавайте коды и пароли третьим лицам',
        html:
            content,
    });
  }

}