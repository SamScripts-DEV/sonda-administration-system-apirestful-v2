import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('salary')
export class SalaryController {
    
    constructor(private readonly salaryService: SalaryService){}

    @Get('current/:userId')
    async getCurrent(@Param('userId') userId: string) {
        return this.salaryService.getCurrentSalary(userId);
    }

    @Get('history/:userId')
    async getHistory(@Param('userId') userId: string) {
        return this.salaryService.getSalaryHistory(userId);
    }

    @Get('at-date/:userId')
    async getAtDate(@Param('userId') userId: string, @Query('date') date: string) {
        return this.salaryService.getSalaryAtDate(userId, new Date(date));
    }

    @Get('period/:userId')
    async getInPeriod(
        @Param('userId') userId: string,
        @Query('from') from: string,
        @Query('to') to: string
    ){
        return this.salaryService.getSalariesInPeriod(userId, new Date(from), new Date(to));
    }

    @Post()
    async create(@Body() dto: CreateSalaryDto, @Req() req){
        return this.salaryService.createSalary(dto, req.user.sub);
    }


}
