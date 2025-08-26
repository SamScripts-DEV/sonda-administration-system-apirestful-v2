import { IsString, IsDateString, IsInt, IsOptional } from "class-validator";

export class CreateVacationDto {
  @IsString()
  userId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  observation?: string;
}