
export interface ShiftRosterResponse {
    id: string;
    areaId: string;
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    users: {userId: string}[];
    shiftTypes: {shiftTypeId: string}[];
}

export function formatShiftRoster(roster: any): ShiftRosterResponse {
  return {
    id: roster.id,
    areaId: roster.areaId,
    name: roster.name,
    description: roster.description,
    startDate: roster.startDate,
    endDate: roster.endDate,
    users: roster.users?.map((u: any) => ({ userId: u.userId })) ?? [],
    shiftTypes: roster.shiftTypes?.map((s: any) => ({ shiftTypeId: s.shiftTypeId })) ?? [],
  };
}