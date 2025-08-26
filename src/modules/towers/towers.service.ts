import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTowerDto } from './dto/create-tower.dto';
import { TowerResponse } from './types/towers-types';

@Injectable()
export class TowersService {
    constructor(private readonly prisma: PrismaService) {}

    //--------------------------------------------------------------------------------------
    // GET Methods
    //--------------------------------------------------------------------------------------
    async findAll(): Promise<TowerResponse[]> {
        return this.prisma.tower.findMany();
    }

    async findOne(id: string): Promise<TowerResponse> {
        if (!id) throw new BadRequestException('Tower ID is required');
        const tower = await this.prisma.tower.findUnique({ where: { id } });
        if (!tower) throw new NotFoundException('Tower not found');
        return tower;
    }

    //--------------------------------------------------------------------------------------
    // POST Methods
    //--------------------------------------------------------------------------------------
    async create(dto: CreateTowerDto): Promise<TowerResponse> {
        if (!dto.name || dto.name.length < 2) throw new BadRequestException('Tower name is required and must be at least 2 characters long');
        if (await this.towerExist(dto.name)) throw new BadRequestException('Tower with this name already exists');
        return this.prisma.tower.create({ data: { ...dto } });
    }

    //--------------------------------------------------------------------------------------
    // PUT Methods
    //--------------------------------------------------------------------------------------
    async update(id: string, dto: Partial<CreateTowerDto>): Promise<TowerResponse> {
        if (!(await this.towerExist(id, true))) throw new NotFoundException('Tower not found');
        if (dto.name && dto.name.length < 2) throw new BadRequestException('Tower name must be at least 2 characters long');
        return this.prisma.tower.update({ where: { id }, data: dto });
    }

    //--------------------------------------------------------------------------------------
    // DELETE Methods
    //--------------------------------------------------------------------------------------
    async remove(id: string): Promise<{ message: string }> {
        if (!id) throw new BadRequestException('Tower ID is required');
        if (!(await this.towerExist(id, true))) throw new NotFoundException('Tower not found');
        await this.prisma.tower.delete({ where: { id } });
        return { message: 'Tower deleted successfully' };
    }

    //--------------------------------------------------------------------------------------
    // PRIVATE HELPER FUNCTIONS
    //--------------------------------------------------------------------------------------
    private async towerExist(value: string, byId = false): Promise<boolean> {
        let tower: TowerResponse | null;
        if (byId || value.length === 36) {
            tower = await this.prisma.tower.findUnique({ where: { id: value } });
        } else {
            tower = await this.prisma.tower.findUnique({ where: { name: value } });
        }
        return !!tower;
    }
}
