export interface SalaryHistory {
  id: string;
  userId: string;
  amount: number; // descifrado
  currency: string;
  validFrom: string;
  validTo?: string;
  comment?: string;
  updatedBy?: string;
}


export interface SalaryHistoryCreateDto {
  userId: string;
  amount: number;
  currency: string;
  validFrom: string;
  comment?: string;
  updatedBy?: string;
}