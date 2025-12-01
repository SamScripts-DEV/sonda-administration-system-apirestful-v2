import { IsString, IsOptional, IsUUID, IsInt, Min, Max, MinLength, IsEnum } from 'class-validator';


export enum GroupType {
    CONTAINER = 'CONTAINER',
    LEADERSHIP = 'LEADERSHIP',
    OPERATIONAL = 'OPERATIONAL',
}

export class CreateOrganizationalGroupDto {
    @IsString()
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID('4', { message: 'El ID del área debe ser un UUID válido' })
    areaId?: string;

    @IsOptional()
    @IsUUID('4', { message: 'El ID del grupo padre debe ser un UUID válido' })
    parentId?: string;

    @IsOptional()
    @IsUUID('4', { message: 'El ID del grupo contenedor debe ser un UUID válido' })
    containerGroupId?: string;

    @IsInt({ message: 'El nivel jerárquico debe ser un número entero' })
    @Min(0, { message: 'El nivel jerárquico debe ser al menos 0' })
    @Max(10, { message: 'El nivel jerárquico no puede ser mayor a 10' })
    hierarchyLevel: number;


    @IsEnum(GroupType)
    @IsOptional()
    groupType?: GroupType;  
}