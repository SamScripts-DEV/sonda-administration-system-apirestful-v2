import { Controller, Get } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller('public/users')
export class UsersPublicUsersController {
    constructor(private readonly usersService: UsersService){}

    @Get()
    async findAll(){
        return this.usersService.findAllUsers();
    }
}