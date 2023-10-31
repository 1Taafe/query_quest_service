import { CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { Role } from './role';
import { Constants } from './secrets';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private jwtService: JwtService, private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        const roles = this.reflector.get<Role[]>('roles', context.getHandler());
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: Constants.jwtSecret
                }
            );
            request['user'] = payload;
            if (roles) {
                if (!roles.includes(request.user.role)) {
                    throw new UnauthorizedException('Отсутсвуют права для выполнения операции');
                }
            }
        }
        catch (error) {
            console.log(error)
            throw new UnauthorizedException('Ошибка авторизации, недостаточно прав');
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}