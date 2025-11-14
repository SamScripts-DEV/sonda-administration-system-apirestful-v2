import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TechnicalLevelService } from './technical-level.service';
import { CreateTechnicalLevelDto } from './dto/create-technical-level.dto';
import { JwtAuthGuard } from '../auth/auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('technical-level')
export class TechnicalLevelController {
  constructor(private readonly service: TechnicalLevelService) {}

  @Post()
  create(@Body() dto: CreateTechnicalLevelDto) {
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateTechnicalLevelDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
