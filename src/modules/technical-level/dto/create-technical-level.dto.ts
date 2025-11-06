import { IsString, IsOptional } from 'class-validator';

export class CreateTechnicalLevelDto {
  @IsString()
  name: string; 

  @IsOptional()
  @IsString()
  description?: string;
}