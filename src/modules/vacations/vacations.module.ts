import { Module } from '@nestjs/common';
import { VacationsController } from './vacations.controller';
import { VacationsService } from './vacations.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VacationsController],
  providers: [VacationsService]
})
export class VacationsModule {}
