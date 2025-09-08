import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';

@Controller('areas')
export class AreasController {
    constructor(private readonly areasService: AreasService) {}

    // GET all areas
    @Get()
    findAll() {
        return this.areasService.findAll();
    }

    // GET one area
    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.areasService.findOne(id);
    }

    // CREATE area
    @Post()
    create(@Body() createAreaDto: CreateAreaDto) {
        return this.areasService.create(createAreaDto);
    }

    // UPDATE area
    @Post(':id')
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updateAreaDto: Partial<CreateAreaDto>) {
        return this.areasService.update(id, updateAreaDto);
    }

    // DELETE area
    @Delete(':id/delete')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.areasService.remove(id);
    }
}
