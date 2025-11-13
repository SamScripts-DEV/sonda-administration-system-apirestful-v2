import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';

import { MultiJwtGuard } from 'src/common/guards/multi-jwt.guard';
import { JwtAuthGuard } from '../auth/auth.guard';


@Controller('holidays')
export class HolidayController {
    constructor(private readonly holidayService: HolidayService) {}
    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@Query('year') year?: string) {
        const y = year ? Number(year) : undefined;
        return this.holidayService.findAll(y);
    }
    @UseGuards(MultiJwtGuard)
    @Get("list-per-year")
    async listholidaysPerDay(@Query('year') year?: string) {
        const y = year ? Number(year) : undefined;
        return this.holidayService.getWeebHookFormat(y);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.holidayService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() holiday: CreateHolidayDto) {
        return this.holidayService.create(holiday);
    }

    //Method to update an existing holiday

    @UseGuards(JwtAuthGuard)
    @Post('sync-external')
    async syncExternalHolidays(@Query('year') year: string){
        const y = Number(year) || new Date().getFullYear();
        return this.holidayService.syncHolidaysIfNotExist(y);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async update(@Param('id') id: string, @Body() holiday: Partial<CreateHolidayDto>) {
        return this.holidayService.update(id, holiday);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.holidayService.remove(id);
    }
}
