import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateSalaryDto {
  @IsString()
  userId: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsDateString()
  validFrom: string;

  @IsOptional()
  @IsDateString()
  validTo: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}