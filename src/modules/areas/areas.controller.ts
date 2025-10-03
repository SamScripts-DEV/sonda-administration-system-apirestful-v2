import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { ProfileGuard } from 'src/common/guards/profile.guard';

@UseGuards(JwtAuthGuard, ProfileGuard, PermissionsGuard)
@Controller('areas')
export class AreasController {
    constructor(private readonly areasService: AreasService) {}

    // GET all areas
    @Get()
    @Permissions('area.read')
    findAll() {
        return this.areasService.findAll();
    }

    // GET one area
    @Get(':id')
    @Permissions('area.read')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.areasService.findOne(id);
    }

    // CREATE area
    @Post()
    @Permissions('area.create')
    create(@Body() createAreaDto: CreateAreaDto) {
        return this.areasService.create(createAreaDto);
    }

    // UPDATE area
    @Put(':id')
    @Permissions('area.update', 'area.create')
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updateAreaDto: Partial<CreateAreaDto>) {
        return this.areasService.update(id, updateAreaDto);
    }

    // DELETE area
    @Permissions('area.delete')
    @Delete(':id/delete')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.areasService.remove(id);
    }
}
