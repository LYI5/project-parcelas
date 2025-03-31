import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private readonly mailerService: MailerService) { }

    async sendActivationEmail(email: string, activationToken: string, userId: string) {
        const activationLink = `http://localhost:3000/auth/activate-account?id=${userId}&code=${activationToken}`;

        await this.mailerService.sendMail({
            to: email,
            subject: 'Activa tu cuenta',
            html: `
        <p>Por favor, activa tu cuenta haciendo clic en el siguiente enlace:</p>
        <a href="${activationLink}">Activar cuenta</a> `,
        });
    }

    async sendResetPasswordEmail(email: string, resetPasswordToken: string) {
        const resetLink = `http://localhost:3000/reset-password?token=${resetPasswordToken}`;

        await this.mailerService.sendMail({
            to: email,
            subject: 'Restablece tu contraseña',
            html: `
        <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
        <a href="${resetLink}">Restablecer contraseña</a> `,
        });
    }
}