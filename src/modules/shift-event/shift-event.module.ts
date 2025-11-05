import { Module } from '@nestjs/common';
import { ShiftEventService } from './shift-event.service';
import { ShiftEventController } from './shift-event.controller';

@Module({
  providers: [ShiftEventService],
  controllers: [ShiftEventController]
})
export class ShiftEventModule {}
