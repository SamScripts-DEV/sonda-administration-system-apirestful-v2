export interface ShiftScheduleResponse {
    id: string;
    shiftTypeId: string;
    dayOfWeek: number | null;
    startTime: string;
    endTime: string;
}

export interface ShiftTypeRoleLocalResponse {
    id: string;
    shiftTypeId: string;
    areaRoleId: string;
    roleName?: string;
    areaName?: string;
}

export interface ShiftTypeResponse {
    id: string;
    name: string;
    description?: string | null;
    color?: string | null;
    isRotative: boolean;
    isStandby: boolean;
    schedules?: ShiftScheduleResponse[];
    roleLocals?: ShiftTypeRoleLocalResponse[];
}


export interface ShiftScheduleInfo {
    id: string;
    startTime: string;
    endTime: string;
    durationHours: number;
}


export interface ShiftInfo {
    id: string;
    name: string;
    description?: string | null
    schedules: ShiftScheduleInfo[]
}