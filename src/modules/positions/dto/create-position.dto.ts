import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePositionDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}
