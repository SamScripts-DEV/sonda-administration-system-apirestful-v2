import { IsArray, IsDateString, IsOptional, isString, IsString } from "class-validator";



export class CreateShiftRosterDto {

    @IsString()
    areaId: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDateString()
    startDate: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    userIds?: string[];

    @IsArray()
    @IsString({ each: true })
    shiftTypeIds: string[];

}