import { Module } from '@nestjs/common';
import { ShiftRosterController } from './shift-roster.controller';
import { ShiftRosterService } from './shift-roster.service';

@Module({
  controllers: [ShiftRosterController],
  providers: [ShiftRosterService]
})
export class ShiftRosterModule {}
