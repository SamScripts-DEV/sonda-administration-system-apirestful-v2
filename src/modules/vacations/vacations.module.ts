import { Module } from '@nestjs/common';
import { VacationsController } from './vacations.controller';
import { VacationsService } from './vacations.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VacationBalanceCalculatorService } from './vacation-balance-calculator.service';

@Module({
  imports: [PrismaModule],
  controllers: [VacationsController],
  providers: [VacationsService, VacationBalanceCalculatorService]
})
export class VacationsModule {}
