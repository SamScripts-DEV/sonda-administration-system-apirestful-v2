import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ShiftTypeRoleLocalService } from './shift-type-role-local.service';
import { CreateShiftTypeRoleLocalDto } from './dto/create-shift-type-role.dto';
import { ShiftTypeRoleLocalResponse } from '../shift-type/types/shift-type-types';

@Controller('shift-type-role-local')
export class ShiftTypeRoleLocalController {
  constructor(private readonly service: ShiftTypeRoleLocalService) {}

  @Post()
  create(@Body() dto: CreateShiftTypeRoleLocalDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(){
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string){
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateShiftTypeRoleLocalDto>){
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
