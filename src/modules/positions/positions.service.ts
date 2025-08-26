import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { PositionResponse } from './types/positions-types';

@Injectable()
export class PositionsService {
    constructor(private readonly prisma: PrismaService) {}

    //--------------------------------------------------------------------------------------
    // GET Methods
    //--------------------------------------------------------------------------------------
    async findAll(): Promise<PositionResponse[]> {
        return this.prisma.position.findMany();
    }

    async findOne(id: string): Promise<PositionResponse> {
        if (!id) throw new BadRequestException('Position ID is required');
        const position = await this.prisma.position.findUnique({ where: { id } });
        if (!position) throw new NotFoundException('Position not found');
        return position;
    }

    //--------------------------------------------------------------------------------------
    // POST Methods
    //--------------------------------------------------------------------------------------
    async create(dto: CreatePositionDto): Promise<PositionResponse> {
        if (!dto.name || dto.name.length < 2) throw new BadRequestException('Position name is required and must be at least 2 characters long');
        // No unique constraint on name, but you can add if needed
        return this.prisma.position.create({ data: { ...dto } });
    }

    //--------------------------------------------------------------------------------------
    // PUT Methods
    //--------------------------------------------------------------------------------------
    async update(id: string, dto: Partial<CreatePositionDto>): Promise<PositionResponse> {
        if (!(await this.positionExist(id))) throw new NotFoundException('Position not found');
        if (dto.name && dto.name.length < 2) throw new BadRequestException('Position name must be at least 2 characters long');
        return this.prisma.position.update({ where: { id }, data: dto });
    }

    //--------------------------------------------------------------------------------------
    // DELETE Methods
    //--------------------------------------------------------------------------------------
    async remove(id: string): Promise<{ message: string }> {
        if (!id) throw new BadRequestException('Position ID is required');
        if (!(await this.positionExist(id))) throw new NotFoundException('Position not found');
        await this.prisma.position.delete({ where: { id } });
        return { message: 'Position deleted successfully' };
    }

    //--------------------------------------------------------------------------------------
    // PRIVATE HELPER FUNCTIONS
    //--------------------------------------------------------------------------------------
    private async positionExist(id: string): Promise<boolean> {
        const position = await this.prisma.position.findUnique({ where: { id } });
        return !!position;
    }
}
