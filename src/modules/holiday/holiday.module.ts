import { Module } from '@nestjs/common';
import { HolidayController } from './holiday.controller';
import { HolidayService } from './holiday.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ExternalHolidayService } from './external-holiday-sync.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule,HttpModule, ConfigModule],
  controllers: [HolidayController],
  providers: [HolidayService, ExternalHolidayService]
})
export class HolidayModule {}
