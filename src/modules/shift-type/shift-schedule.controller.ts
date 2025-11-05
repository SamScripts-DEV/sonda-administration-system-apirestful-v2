import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ShiftScheduleService } from './shift-schedule.service';
import { CreateShiftScheduleDto } from './dto/create-shift-schedule.dto';
import { ShiftScheduleResponse } from './types/shift-type-types';

@Controller('shift-schedule')
export class ShiftScheduleController {
  constructor(private readonly shiftScheduleService: ShiftScheduleService) {}

  @Post()
  create(@Body() dto: CreateShiftScheduleDto) {
    return this.shiftScheduleService.create(dto);
  }

  @Get()
  findAll(): Promise<ShiftScheduleResponse[]> {
    return this.shiftScheduleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftScheduleService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateShiftScheduleDto>,
  ) {
    return this.shiftScheduleService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string){
    return this.shiftScheduleService.remove(id);
  }
}
