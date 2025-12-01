import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class AddMembersDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'Debe proporcionar al menos un usuario' })
    @IsUUID('4', { each: true, message: 'Cada ID de usuario debe ser un UUID válido' })
    userIds: string[];
}