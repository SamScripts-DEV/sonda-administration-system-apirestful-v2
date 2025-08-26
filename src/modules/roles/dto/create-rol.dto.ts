import { IsOptional, IsString, MinLength,  } from "class-validator";


export class CreateRoleDto {
    @IsString()
    @MinLength(2)
    name: string

    @IsString()
    @MinLength(2)
    @IsOptional()
    description?: string

}