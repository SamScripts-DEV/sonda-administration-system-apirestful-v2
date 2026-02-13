import { IsString } from "class-validator";


export class ShiftAssignmentDto {
    @IsString()
    userId: string;

    @IsString()
    shiftId: string;

    @IsString()
    date: string;
}