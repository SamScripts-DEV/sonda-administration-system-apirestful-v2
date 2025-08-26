import { IsOptional, IsString, MinLength } from "class-validator";


export class CreatePermissionDto {

    @IsString()
    @MinLength(2)
    code: string;

    @IsString()
    @MinLength(2)
    name: string;

    @IsString()
    @MinLength(2)
    @IsOptional()
    description?: string;
}