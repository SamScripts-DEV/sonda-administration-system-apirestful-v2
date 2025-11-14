import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserTechnicalLevelService } from './user-technical-level.service';
import { CreateUserTechnicalLevelDto } from './dto/create-user-technical-level.dto';
import { JwtAuthGuard } from '../auth/auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('user-technical-level')
export class UserTechnicalLevelController {
  constructor(private readonly service: UserTechnicalLevelService) {}

  @Post()
  create(@Body() dto: CreateUserTechnicalLevelDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
