import { IsDateString, IsOptional, IsString } from "class-validator";

export class UpdateShiftRosterDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString({ each: true })
    userIds?: string[];

    @IsOptional()
    @IsString({ each: true })
    shiftTypeIds?: string[];
}