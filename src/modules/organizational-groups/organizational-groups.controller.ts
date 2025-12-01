import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    Patch
} from '@nestjs/common';
import { OrganizationalGroupsService } from './organizational-groups.service';
import { CreateOrganizationalGroupDto } from './dto/create-organizational-groups.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import {
    OrganizationalGroupResponse,
    GroupMemberResponse,
    OrganizationalGroupHierarchy,
    OrgChartNode
} from './types/organizational-groups-types';

@Controller('organizational-groups')
@UseGuards(JwtAuthGuard)
export class OrganizationalGroupsController {
    constructor(
        private readonly organizationalGroupsService: OrganizationalGroupsService
    ) { }

    //create organizational group
    @Post()
    async create(
        @Body() createDto: CreateOrganizationalGroupDto
    ): Promise<OrganizationalGroupResponse> {
        return this.organizationalGroupsService.create(createDto);
    }

    //Get all organizational groups
    @Get()
    async findAll(): Promise<OrganizationalGroupResponse[]> {
        return this.organizationalGroupsService.findAll();
    }

    //Get organizational groups by area ID
    @Get('by-area/:areaId')
    async findByArea(
        @Param('areaId') areaId: string
    ): Promise<OrganizationalGroupResponse[]> {
        return this.organizationalGroupsService.findByArea(areaId);
    }

    //Get organizational chart
    @Get('orgchart-flat')
    async getOrgChartFlat(
        @Query('areaId') areaId?: string
    ): Promise<OrgChartNode[]> {
        return this.organizationalGroupsService.getOrgChartFlat(areaId);
    }

    //Get one organizational group by ID
    @Get(':id')
    async findOne(
        @Param('id') id: string
    ): Promise<OrganizationalGroupResponse> {
        return this.organizationalGroupsService.findOne(id);
    }

    //Get organizational group hierarchy
    @Get(':id/hierarchy')
    async getHierarchy(
        @Param('id') id: string
    ): Promise<OrganizationalGroupHierarchy> {
        return this.organizationalGroupsService.getHierarchy(id);
    }

    //Update organizational group
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateDto: Partial<CreateOrganizationalGroupDto>
    ): Promise<OrganizationalGroupResponse> {
        return this.organizationalGroupsService.update(id, updateDto);
    }

    //Delete organizational group
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.organizationalGroupsService.remove(id);
    }

    //Get assignable users for organizational group
    @Get(':id/assignable-users')
    async getAssignableUsers(
        @Param('id') id: string
    ) {
        return this.organizationalGroupsService.getAssignableUsers(id);
    }

    //add members to organizational group
    @Post(':id/members')
    async addMembers(
        @Param('id') id: string,
        @Body() addMembersDto: AddMembersDto
    ): Promise<GroupMemberResponse[]> {
        return this.organizationalGroupsService.addMembers(
            id,
            addMembersDto.userIds
        );
    }

    //remove member from organizational group
    @Delete(':id/members/:memberId')
    async removeMember(
        @Param('id') id: string,
        @Param('memberId') memberId: string
    ) {
        return this.organizationalGroupsService.removeMember(id, memberId);
    }
}
