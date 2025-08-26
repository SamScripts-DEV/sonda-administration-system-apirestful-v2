import { IsString, MinLength, IsEmail, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsString()
  @MinLength(2)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  passwordHash: string;

  @IsString()
  phone: string;

  @IsBoolean()
  active?: boolean;


  @IsString()
  nationalId: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsArray()
  @IsString({ each: true })
  towerIds: string[];

  @IsString()
  departmentId: string;

  @IsOptional()
  @IsString()
  positionId?: string;
}