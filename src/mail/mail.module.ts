import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
    imports: [
        MailerModule.forRoot({
            transport: {
                host: 'smtp.gmail.com',
                port: 465,
                selecure: true,
                auth: {
                    user: 'Tu_corre',
                    pass: 'tu clave',
                },
            },
            defaults: {
                from: '"Soporte" <lTu_Correo>',
            },
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule { }
