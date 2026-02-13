export interface ShiftAssignmentCalendarResponse {
    id: string;
    userId: string;
    shiftTypeId: string;
    date: string;
    observation?: string | null;
    originalUserId?: string | null;
    isExtra: boolean;
    isHoliday: boolean;
    isWeekend: boolean;
    isStandby: boolean;
    shiftType: {
        name: string;
        description?: string | null;
        color?: string | null;
        isRotative: boolean;
        isStandby: boolean;
        schedules: {
            startTime: string;
            endTime: string;
            dayOfWeek: number | null;
        }[];
    };
}

export function formatShiftAssignmentCalendar(assignment: any): ShiftAssignmentCalendarResponse {
    return {
        id: assignment.id,
        userId: assignment.userId,
        shiftTypeId: assignment.shiftTypeId,
        date: assignment.date,
        observation: assignment.observation ?? null,
        originalUserId: assignment.originalUserId ?? null,
        isExtra: assignment.isExtra,
        isHoliday: assignment.isHoliday,
        isWeekend: assignment.isWeekend,
        isStandby: assignment.isStandby,
        shiftType: {
            name: assignment.shiftType.name,
            description: assignment.shiftType.description,
            color: assignment.shiftType.color,
            isRotative: assignment.shiftType.isRotative,
            isStandby: assignment.shiftType.isStandby,
            schedules: assignment.shiftType.schedules.map((sch: any) => ({
                startTime: sch.startTime,
                endTime: sch.endTime,
                dayOfWeek: sch.dayOfWeek
            }))
        }
    };
}