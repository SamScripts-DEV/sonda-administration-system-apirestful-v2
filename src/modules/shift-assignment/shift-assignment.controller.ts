import { Controller,Body, Post, Get, Query, Param, Patch, Delete } from '@nestjs/common';
import { ShiftAssignmentService } from './shift-assignment.service';
import { ShiftAssignmentBatchDto } from './dto/shift-assignment-batch.dto';
import { ShiftAssignmentSingleDto } from './dto/shift-assignment-single.dto';

@Controller('shift-assignment')
export class ShiftAssignmentController {
    constructor(private readonly shiftAssigmentService: ShiftAssignmentService) {}


    @Get()
    async findAllAssignments(
        @Query('month') month: number,
        @Query('year') year: number
    ) {
        return this.shiftAssigmentService.findAllAssignments(month, year)
    }

    @Get(':id')
    async findOneAssignment(@Param('id') id: string) {
        return this.shiftAssigmentService.findOneAssignment(id)
    }


    @Post('batch')
    async assignBatch(@Body() dto: ShiftAssignmentBatchDto ) {
        return this.shiftAssigmentService.assignBatch(dto)
    }

    @Post('single')
    async assignSingle(@Body() dto: ShiftAssignmentSingleDto) {
        return this.shiftAssigmentService.assignSingle(dto)
    }

    @Post(':id/reassign-extra')
    async reassignShiftAsExtra(
        @Param('id') id: string,
        @Body() body: { newUserId: string, observation?: string }
    ){
        return this.shiftAssigmentService.reassignShiftAsExtra(id, body.newUserId, body.observation)
    }



    @Patch(':id')
    async updatedAssignment(
        @Param('id') id: string,
        @Body() dto: Partial<ShiftAssignmentSingleDto>
    ) {
        return this.shiftAssigmentService.updateAssignment(id, dto)
    }

    @Delete(':id')
    async deleteAssignment(
        @Param('id') id: string,
        @Query('deletedByUserId') deletedByUserId: string
    ){
        return this.shiftAssigmentService.deleteAssignment(id, deletedByUserId)
    }

    
}
