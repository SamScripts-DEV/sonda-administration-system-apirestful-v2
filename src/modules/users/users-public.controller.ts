import { Body, Controller, Get, Post } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller('public/users')
export class UsersPublicUsersController {
    constructor(private readonly usersService: UsersService){}

    @Get()
    async findAll(){
        return this.usersService.findAllUsers();
    }

    @Post('info-users')
    async getUserInfoForShiftAssignments(
        @Body('ids') ids: string[]
    ) {
        return this.usersService.findUserInfoForShiftAssigments(ids)
    }
}