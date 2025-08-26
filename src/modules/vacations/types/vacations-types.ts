export type VacationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VacationBalance {
  year: number;
  daysAvailable: number;
  daysTaken: number;
  daysOwed: number;
}

export interface VacationRequest {
  id: string;
  userId: string;
  createdById: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  status: VacationRequestStatus;
  observation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VacationCalculation {
  daysUsed: number;
  daysAvailable: number;
  daysRemaining: number;
  daysAssigned: number;
  daysExceeded: number;
  hoursExceeded?: number;
  observation?: string ;
}

export type VacationRequestResponse = Omit<VacationRequest, 'createdAt' | 'updatedAt'> & VacationCalculation;

export interface VacationSummary {
  balance: VacationBalance;
  requests: VacationRequest[];
  pendingRequests: VacationRequest[];
  approvedRequests: VacationRequest[];
  totalPendingDays: number;
  totalApprovedDays: number;
}
