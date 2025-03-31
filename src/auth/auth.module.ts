import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EncoderService } from './encoder.service';
import { JwtStrategy } from './jwt.strategy';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: 'super-secret', // Considera usar variables de entorno
            signOptions: {
                expiresIn: 3600, // 1 hora
            },
        }),
        PrismaModule,
        MailModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, EncoderService, JwtStrategy],
    exports: [JwtStrategy, PassportModule],
})
export class AuthModule { }