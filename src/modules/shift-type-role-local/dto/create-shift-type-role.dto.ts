import { IsString } from 'class-validator';

export class CreateShiftTypeRoleLocalDto {
  @IsString()
  shiftTypeId: string;

  @IsString()
  areaRoleId: string;
}