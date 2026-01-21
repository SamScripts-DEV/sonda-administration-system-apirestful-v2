import { Module } from '@nestjs/common';
import { ShiftTypeController } from './shift-type.controller';
import { ShiftTypeService } from './shift-type.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShiftTypePublicController } from './shift-type-public.controller';

@Module({
  controllers: [ShiftTypeController, ShiftTypePublicController],
  providers: [ShiftTypeService, PrismaService],
  exports: [ShiftTypeService],
})
export class ShiftTypeModule {}
