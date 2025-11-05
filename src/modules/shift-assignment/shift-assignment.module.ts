import { Module } from '@nestjs/common';
import { ShiftAssignmentService } from './shift-assignment.service';
import { ShiftAssignmentController } from './shift-assignment.controller';

@Module({
  providers: [ShiftAssignmentService],
  controllers: [ShiftAssignmentController]
})
export class ShiftAssignmentModule {}
