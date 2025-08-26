import { IsString, MinLength, IsOptional, IsDateString } from "class-validator";

export class CreateHolidayDto {
    @IsString()
    @MinLength(1)
    name: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsOptional()
    @IsString()
    observation?: string;
}