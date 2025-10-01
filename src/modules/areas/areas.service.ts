import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { AreaResponse, AreaWithUsersResponse } from './types/areas-types';


@Injectable()
export class AreasService {
    constructor(private readonly prisma: PrismaService) {}

    //--------------------------------------------------------------------------------------
    // GET Methods
    //--------------------------------------------------------------------------------------
    async findAll(): Promise<AreaWithUsersResponse[]> {
        const areas = await this.prisma.area.findMany({
            include: {
                userAreas:{
                    include: {
                        user:{
                            select:{
                                id: true,
                                firstName: true,
                                lastName: true,
                                position:{
                                    select: { name: true}
                                }
                            }
                        }
                    }
                },
                areaRoles: {
                    select: {
                        role: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        return areas.map(area => ({
            id: area.id,
            name: area.name,
            description: area.description,
            createdAt: area.createdAt,
            updatedAt: area.updatedAt,
            users: area.userAreas.map(ua => ({
                id: ua.user.id,
                firstName: ua.user.firstName,
                lastName: ua.user.lastName,
                position: ua.user.position?.name
            })),
            roles: area.areaRoles.map(ar => ({
                id: ar.role.id,
                name: ar.role.name
            }))
        }))
    }

    async findOne(id: string): Promise<AreaResponse> {
        if (!id) throw new BadRequestException('Area ID is required');
        const area = await this.prisma.area.findUnique({ where: { id } });
        if (!area) throw new NotFoundException('Area not found');
        return area;
    }

    //--------------------------------------------------------------------------------------
    // POST Methods
    //--------------------------------------------------------------------------------------
    async create(dto: CreateAreaDto): Promise<AreaResponse> {
        if (!dto.name || dto.name.length < 2) throw new BadRequestException('Area name is required and must be at least 2 characters long');
        if (await this.areaExist(dto.name)) throw new BadRequestException('Area with this name already exists');
        return this.prisma.area.create({ data: { ...dto } });
    }

    //--------------------------------------------------------------------------------------
    // PUT Methods
    //--------------------------------------------------------------------------------------
    async update(id: string, dto: Partial<CreateAreaDto>): Promise<AreaResponse> {
        if (!(await this.areaExist(id, true))) throw new NotFoundException('Area not found');
        if (dto.name && dto.name.length < 2) throw new BadRequestException('Area name must be at least 2 characters long');
        return this.prisma.area.update({ where: { id }, data: dto });
    }

    //--------------------------------------------------------------------------------------
    // DELETE Methods
    //--------------------------------------------------------------------------------------
    async remove(id: string): Promise<{ message: string }> {
        if (!id) throw new BadRequestException('Area ID is required');
        if (!(await this.areaExist(id, true))) throw new NotFoundException('Area not found');
        await this.prisma.area.delete({ where: { id } });
        return { message: 'Area deleted successfully' };
    }

    //--------------------------------------------------------------------------------------
    // PRIVATE HELPER FUNCTIONS
    //--------------------------------------------------------------------------------------
    private async areaExist(value: string, byId = false): Promise<boolean> {
        let area: AreaResponse | null;
        if (byId || value.length === 36) {
            area = await this.prisma.area.findUnique({ where: { id: value } });
        } else {
            area = await this.prisma.area.findUnique({ where: { name: value } });
        }
        return !!area;
    }
}
