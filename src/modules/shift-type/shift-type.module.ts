import { Module } from '@nestjs/common';
import { ShiftTypeController } from './shift-type.controller';
import { ShiftTypeService } from './shift-type.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ShiftTypeController],
  providers: [ShiftTypeService, PrismaService],
  exports: [ShiftTypeService],
})
export class ShiftTypeModule {}
