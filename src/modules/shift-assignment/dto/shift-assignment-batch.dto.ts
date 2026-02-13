import { Type } from "class-transformer";
import { IsArray, ValidateNested, IsString, IsOptional } from "class-validator";
import { ShiftAssignmentDto } from "./shift-assignment.dto";


export class ShiftAssignmentBatchDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ShiftAssignmentDto)
    assignments: ShiftAssignmentDto[];

    @IsString()
    areaId: string;

    @IsString()
    shiftRosterId: string;

    @IsOptional()
    summary?: Record<string, any>;

    @IsOptional()
    @IsString()
    explanation?: string;
}