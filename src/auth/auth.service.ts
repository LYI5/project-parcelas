import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
    UnprocessableEntityException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { EncoderService } from './encoder.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { v4 } from 'uuid';
import { ActivateUserDto } from './dto/activate-user.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from 'src/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private encoderService: EncoderService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    async registerUser(registerUserDto: RegisterUserDto): Promise<void> {
        const { name, email, password } = registerUserDto;
        const hashedPassword = await this.encoderService.encodePassword(password);
        const activationToken = v4();

        try {
            const user = await this.prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    activationToken,
                },
            });

            await this.mailService.sendActivationEmail(email, activationToken, user.id);
        } catch (error) {
            if (error.code === 'P2002') {
                throw new BadRequestException('This email is already registered');
            }
            throw error;
        }
    }

    async login(loginDto: LoginDto): Promise<{ accessToken: string, user: { id: string, name: string, email: string } }> {
        const { email, password } = loginDto;

        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Please check your credentials');
        }

        if (!user.active) {
            throw new UnauthorizedException('Please verify your email before logging in');
        }

        if (await this.encoderService.checkPassword(password, user.password)) {
            const payload: JwtPayload = { id: user.id, email, active: user.active };
            const accessToken = await this.jwtService.sign(payload);

            return {
                accessToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                }
            };
        }

        throw new UnauthorizedException('Please check your credentials');
    }

    async activateUser(activateUserDto: ActivateUserDto): Promise<void> {
        const { id, code } = activateUserDto;

        const user = await this.prisma.user.findFirst({
            where: {
                id,
                activationToken: code,
                active: false,
            },
        });

        if (!user) {
            throw new UnprocessableEntityException('Invalid activation link or account already activated');
        }

        await this.prisma.user.update({
            where: { id },
            data: {
                active: true,
                activationToken: null,
            },
        });
    }

    async requestResetPassword(
        requestResetPasswordDto: RequestResetPasswordDto,
    ): Promise<void> {
        const { email } = requestResetPasswordDto;

        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }

        const resetPasswordToken = v4();

        await this.prisma.user.update({
            where: { id: user.id },
            data: { resetPasswordToken },
        });

        await this.mailService.sendResetPasswordEmail(email, resetPasswordToken);
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
        const { resetPasswordToken, password } = resetPasswordDto;

        const user = await this.prisma.user.findFirst({
            where: { resetPasswordToken },
        });

        if (!user) {
            throw new NotFoundException('Invalid reset password token');
        }

        const hashedPassword = await this.encoderService.encodePassword(password);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
            },
        });
    }

    async changePassword(
        changePasswordDto: ChangePasswordDto,
        user: User,
    ): Promise<void> {
        const { oldPassword, newPassword } = changePasswordDto;

        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!dbUser) {
            throw new NotFoundException('User not found');
        }

        if (await this.encoderService.checkPassword(oldPassword, dbUser.password)) {
            const hashedPassword = await this.encoderService.encodePassword(newPassword);

            await this.prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            });
        } else {
            throw new BadRequestException('Old password does not match');
        }
    }
}