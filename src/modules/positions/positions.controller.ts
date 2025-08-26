import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';

@Controller('positions')
export class PositionsController {
    constructor(private readonly positionsService: PositionsService) {}

    // GET all positions
    @Get()
    findAll() {
        return this.positionsService.findAll();
    }

    // GET one position
    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.positionsService.findOne(id);
    }

    // CREATE position
    @Post()
    create(@Body() createPositionDto: CreatePositionDto) {
        return this.positionsService.create(createPositionDto);
    }

    // UPDATE position
    @Post(':id')
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updatePositionDto: Partial<CreatePositionDto>) {
        return this.positionsService.update(id, updatePositionDto);
    }

    // DELETE position
    @Delete(':id/delete')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.positionsService.remove(id);
    }
}
