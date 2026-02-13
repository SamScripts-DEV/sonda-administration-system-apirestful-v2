import { Module } from '@nestjs/common';
import { ShiftAssignmentService } from './shift-assignment.service';
import { ShiftAssignmentController } from './shift-assignment.controller';
import { HolidayService } from '../holiday/holiday.service';
import { ExternalHolidayService } from '../holiday/external-holiday-sync.service';
import { HolidayModule } from '../holiday/holiday.module';

@Module({
  imports:[HolidayModule],
  providers: [ShiftAssignmentService],
  controllers: [ShiftAssignmentController]
})
export class ShiftAssignmentModule {}
