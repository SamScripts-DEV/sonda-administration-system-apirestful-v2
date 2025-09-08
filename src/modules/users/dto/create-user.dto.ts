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

  @IsArray()
  @IsString({ each: true })
  phone: string[];

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

  @IsOptional()
  @IsString()
  province?: string;

  @IsArray()
  @IsString({ each: true })
  areaIds: string[];

  @IsString()
  departmentId: string;

  @IsOptional()
  @IsString()
  positionId?: string;
}