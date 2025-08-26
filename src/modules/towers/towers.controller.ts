import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { TowersService } from './towers.service';
import { CreateTowerDto } from './dto/create-tower.dto';

@Controller('towers')
export class TowersController {
    constructor(private readonly towersService: TowersService) {}

    // GET all towers
    @Get()
    findAll() {
        return this.towersService.findAll();
    }

    // GET one tower
    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.towersService.findOne(id);
    }

    // CREATE tower
    @Post()
    create(@Body() createTowerDto: CreateTowerDto) {
        return this.towersService.create(createTowerDto);
    }

    // UPDATE tower
    @Post(':id')
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updateTowerDto: Partial<CreateTowerDto>) {
        return this.towersService.update(id, updateTowerDto);
    }

    // DELETE tower
    @Delete(':id/delete')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.towersService.remove(id);
    }
}
