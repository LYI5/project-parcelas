import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { SensoresModule } from './sensores/sensores.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SensoresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
