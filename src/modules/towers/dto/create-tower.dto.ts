import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTowerDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}
