import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private prisma: PrismaService,
    ) {
        super({
            secretOrKey: 'super-secret', // Considera usar variables de entorno
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        });
    }

    async validate(payload: JwtPayload) {
        const { id } = payload;
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new UnauthorizedException();
        }

        return user;
    }
}