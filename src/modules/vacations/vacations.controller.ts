import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { VacationsService } from './vacations.service';
import { CreateVacationDto, VacationRequestFilterDto } from './dto/create-vacation.dto';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('vacations')
export class VacationsController {
    constructor(
        private readonly vacationService: VacationsService
    ){}


    @Get('my-requests')
    async getMyVacationsRequest(@Req() req) {
        return this.vacationService.getVacationRequests(req.user.sub);
    }

    @Get()
    async getAllVacationRequests(@Query() filter: VacationRequestFilterDto) {
        return this.vacationService.getAllVacationRequests(filter);
    }

    
    @Get('id')
    async getVacationById(@Param('id') id: string) {
        return this.vacationService.getVacationRequestById(id);
    }


    @Post()
    async createVacationRequest(@Body() dto: CreateVacationDto, @Req() req) {
        return this.vacationService.generateVacationRequest(dto, {id: req.user.sub});
    }

    @Patch(':id')
    async updateVacationRequest(
        @Param('id') id: string,
        @Body() dto: Partial<CreateVacationDto>,
        @Req() req
    ){
        return this.vacationService.updateVacationRequest(id, dto, {id: req.user.sub});

    }

    @Patch('approve/:id')
    async approveOrRejectVacation(
        @Param('id') id: string,
        @Body() body: {action: 'APPROVED' | 'REJECTED', observation?: string},
        @Req() req
    ) {
        return this.vacationService.handleVacationRequestApproval(
            id,
            req.user.sub,
            body.action,
            body.observation
        )
    }


    @Delete(':id')
    async getVacationRequestById(
        @Param('id') id: string,
        @Req() req
    ){
        return this.vacationService.deleteVacationRequest(id, {id: req.user.id});
    }



}
