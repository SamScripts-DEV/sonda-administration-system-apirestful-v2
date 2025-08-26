import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department';
import { DepartmentResponse } from './types/departments-types';

@Injectable()
export class DepartmentsService {
    constructor(private readonly prisma: PrismaService) {}

    //--------------------------------------------------------------------------------------
    // GET Methods
    //--------------------------------------------------------------------------------------
    async findAll(): Promise<DepartmentResponse[]> {
        return this.prisma.department.findMany();
    }

    async findOne(id: string): Promise<DepartmentResponse> {
        if (!id) throw new BadRequestException('Department ID is required');
        const department = await this.prisma.department.findUnique({ where: { id } });
        if (!department) throw new NotFoundException('Department not found');
        return department;
    }

    //--------------------------------------------------------------------------------------
    // POST Methods
    //--------------------------------------------------------------------------------------
    async create(dto: CreateDepartmentDto): Promise<DepartmentResponse> {
        if (!dto.name || dto.name.length < 2) throw new BadRequestException('Department name is required and must be at least 2 characters long');
        if (await this.departmentExist(dto.name)) throw new BadRequestException('Department with this name already exists');
        return this.prisma.department.create({ data: { ...dto } });
    }

    //--------------------------------------------------------------------------------------
    // PUT Methods
    //--------------------------------------------------------------------------------------
    async update(id: string, dto: Partial<CreateDepartmentDto>): Promise<DepartmentResponse> {
        if (!(await this.departmentExist(id, true))) throw new NotFoundException('Department not found');
        if (dto.name && dto.name.length < 2) throw new BadRequestException('Department name must be at least 2 characters long');
        return this.prisma.department.update({ where: { id }, data: dto });
    }

    //--------------------------------------------------------------------------------------
    // DELETE Methods
    //--------------------------------------------------------------------------------------
    async remove(id: string): Promise<{ message: string }> {
        if (!id) throw new BadRequestException('Department ID is required');
        if (!(await this.departmentExist(id, true))) throw new NotFoundException('Department not found');
        await this.prisma.department.delete({ where: { id } });
        return { message: 'Department deleted successfully' };
    }

    //--------------------------------------------------------------------------------------
    // PRIVATE HELPER FUNCTIONS
    //--------------------------------------------------------------------------------------
    private async departmentExist(value: string, byId = false): Promise<boolean> {
        let department: DepartmentResponse | null;
        if (byId || value.length === 36) {
            department = await this.prisma.department.findUnique({ where: { id: value } });
        } else {
            department = await this.prisma.department.findUnique({ where: { name: value } });
        }
        return !!department;
    }
}
