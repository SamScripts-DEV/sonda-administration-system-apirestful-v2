// create-user-technical-level.dto.ts
import { IsString } from 'class-validator';

export class CreateUserTechnicalLevelDto {
  @IsString()
  userId: string;

  @IsString()
  technicalLevelId: string;
}