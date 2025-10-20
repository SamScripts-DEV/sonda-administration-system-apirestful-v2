import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVacationDto } from './dto/create-vacation.dto';
import { VacationRequestResponse, VacationRequestStatus } from './types/vacations-types';
import { VacationBalanceCalculatorService } from './vacation-balance-calculator.service';

@Injectable()
export class VacationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly balanceCalculator: VacationBalanceCalculatorService
    ) { }

    //GET method to get vacation requests

    async getVacationRequestById(requestId: string): Promise<VacationRequestResponse | null> {
        const req = await this.prisma.vacationRequest.findUnique({ where: { id: requestId } });
        if (!req) return null;

        const year = req.startDate.getFullYear();

        let calc;
        if (req.status === 'PENDING') {
            const projected = await this.balanceCalculator.getProjectedBalance(req.userId, year, req.id);
            calc = this.calculateVacationValuesWithPending(req.daysRequested, projected, req.observation ?? undefined);
        } else {
            const balance = await this.getUserVacationBalance(req.userId, year);
            calc = this.calculateVacationValues(req.daysRequested, balance, req.observation ?? undefined);
        }



        return {
            ...req,
            startDate: req.startDate.toISOString(),
            endDate: req.endDate.toISOString(),
            ...calc,
            status: req.status as VacationRequestStatus
        };
    }

    //Get all request of a user authenticated
    async getVacationRequests(userId: string): Promise<VacationRequestResponse[]> {
        const requests = await this.prisma.vacationRequest.findMany({ where: { userId } });

        return Promise.all(requests.map(async req => {
            const year = req.startDate.getFullYear();

            let calc;
            if (req.status === 'PENDING') {
                const projected = await this.balanceCalculator.getProjectedBalance(userId, year, req.id);
                calc = this.calculateVacationValuesWithPending(req.daysRequested, projected, req.observation ?? undefined);
            } else {
                const balance = await this.getUserVacationBalance(req.userId, year);
                calc = this.calculateVacationValues(req.daysRequested, balance, req.observation ?? undefined);
            }

            return {
                ...req,
                startDate: req.startDate.toISOString(),
                endDate: req.endDate.toISOString(),
                ...calc,
                status: req.status as VacationRequestStatus
            };
        }));
    }

    //Get all requests in the system, with optional filters
    async getAllVacationRequests(filter: { userId?: string, areaId?: string, status?: string }): Promise<VacationRequestResponse[]> {
        const where: any = {};

        if (filter.userId) where.userId = filter.userId;
        if (filter.status) where.status = filter.status;

        if (filter.areaId) {
            const users = await this.prisma.user.findMany({
                where: { areas: { some: { id: filter.areaId } } },
                select: { id: true }
            });
            where.userId = { in: users.map(u => u.id) };
        }

        const request = await this.prisma.vacationRequest.findMany({ where });

        return Promise.all(request.map(async req => {
            const year = req.startDate.getFullYear();

            let calc;
            if (req.status === 'PENDING') {
                const projected = await this.balanceCalculator.getProjectedBalance(req.userId, year, req.id);
                calc = this.calculateVacationValuesWithPending(req.daysRequested, projected, req.observation ?? undefined);
            } else {
                const balance = await this.getUserVacationBalance(req.userId, year);
                calc = this.calculateVacationValues(req.daysRequested, balance, req.observation ?? undefined);
            }
            return {
                ...req,
                startDate: req.startDate.toISOString(),
                endDate: req.endDate.toISOString(),
                ...calc,
                status: req.status as VacationRequestStatus
            }
        }))
    }


    //POST method to create a vacation
    async generateVacationRequest(vacationRequest: CreateVacationDto, userAuth: { id: string }): Promise<VacationRequestResponse> {
        const { userId, startDate, endDate } = vacationRequest;
        const start = new Date(startDate);
        const end = new Date(endDate);

        const daysByYear = this.splitDaysByYear(start, end);

        for (const [yearStr, daysRequestedInYear] of Object.entries(daysByYear)) {
            const year = Number(yearStr);

            if (await this.hasVacationRequestPending(userId, new Date(year, 0, 1))) {
                throw new ConflictException(`User already has a pending vacation request for year ${year}.`);
            }

            if (await this.hasVacationInRange(userId,
                new Date(year, 0, 1),
                new Date(year, 11, 31))) {
                throw new ConflictException(`Vacation request overlaps with existing vacation in year ${year}.`);
            }
        }

        const daysRequested = this.calculateDaysInRange(start, end);
        const year = start.getFullYear();

        await this.getUserVacationBalance(userId, year);


        const projected = await this.balanceCalculator.getProjectedBalance(userId, year);
        const {
            daysUsed,
            daysAvailable,
            daysRemaining,
            daysAssigned,
            daysExceeded,
            observation
        } = this.calculateVacationValuesWithPending(daysRequested, projected, vacationRequest.observation);

        const newRequestVacation = await this.prisma.vacationRequest.create({
            data: {
                userId,
                createdById: userAuth.id,
                startDate: start,
                endDate: end,
                daysRequested,
                observation: vacationRequest.observation,
                status: 'PENDING',
            },
        });

        return {
            ...newRequestVacation,
            startDate: newRequestVacation.startDate.toISOString(),
            endDate: newRequestVacation.endDate.toISOString(),
            daysUsed,
            daysAvailable,
            daysRemaining,
            daysAssigned,
            daysExceeded,
            observation,
            status: newRequestVacation.status as VacationRequestStatus
        };
    }


    //Updated request
    async updateVacationRequest(
        requestId: string,
        dto: Partial<CreateVacationDto>,
        userAuth: { id: string }
    ): Promise<VacationRequestResponse> {
        const existing = await this.prisma.vacationRequest.findUnique({ where: { id: requestId } });
        if (!existing) throw new ConflictException('Vacation request not found.');
        if (existing.status !== 'PENDING') throw new ConflictException('Only pending requests can be updated.');

        const startDate = dto.startDate || existing.startDate
        const endDate = dto.endDate || existing.endDate
        const userId = dto.userId || existing.userId;

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) throw new ConflictException('Start date must be before end date.');

        const daysByYear = this.splitDaysByYear(start, end);

        for (const [yearStr, daysRequestedInYear] of Object.entries(daysByYear)) {
            const year = Number(yearStr);

            const pending = await this.prisma.vacationRequest.findFirst({
                where: {
                    userId,
                    status: 'PENDING',
                    id: { not: requestId },
                    startDate: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) }
                }
            });
            if (pending) {
                throw new ConflictException(`User already has another pending vacation request for year ${year}.`);
            }

            const overlap = await this.prisma.vacationRequest.findFirst({
                where: {
                    userId,
                    id: { not: requestId },
                    OR: [
                        {
                            startDate: { lte: end },
                            endDate: { gte: start },
                        }
                    ]
                }
            });
            if (overlap) {
                throw new ConflictException(`Vacation request overlaps with existing vacation in year ${year}.`);
            }
        }

        const daysRequested = this.calculateDaysInRange(start, end);
        const year = start.getFullYear();

        const projected = await this.balanceCalculator.getProjectedBalance(userId, year);
        const {
            daysUsed,
            daysAvailable,
            daysRemaining,
            daysAssigned,
            daysExceeded,
            observation
        } = this.calculateVacationValuesWithPending(daysRequested, projected, dto.observation);

        const updatedRequest = await this.prisma.vacationRequest.update({
            where: { id: requestId },
            data: {
                userId,
                startDate: start,
                endDate: end,
                daysRequested,
                observation,
            },
        });

        return {
            ...updatedRequest,
            startDate: updatedRequest.startDate.toISOString(),
            endDate: updatedRequest.endDate.toISOString(),
            daysUsed,
            daysAvailable,
            daysRemaining,
            daysAssigned,
            daysExceeded,
            observation,
            status: updatedRequest.status as VacationRequestStatus
        };
    }

    //Method  to aprove or reject a vacation request
    async handleVacationRequestApproval(
        requestId: string,
        approverId: string,
        action: 'APPROVED' | 'REJECTED',
        observation?: string
    ): Promise<VacationRequestResponse> {
        const request = await this.prisma.vacationRequest.findUnique({ where: { id: requestId } });
        if (!request) throw new ConflictException('Vacation request not found.');
        if (request.status !== 'PENDING') throw new ConflictException('Only pending requests can be processed.');

        if (action === 'REJECTED') {
            return this.rejectVacationRequest(request, approverId, observation)
        } else {
            return this.approveVacationRequest(request, approverId, observation)
        }


    }


    async deleteVacationRequest(requestId: string, userAuth: { id: string }): Promise<{ message: string }> {
        const request = await this.prisma.vacationRequest.findUnique({ where: { id: requestId } });
        if (!request) throw new ConflictException('Vacation request not found.');
        if (request.status !== 'PENDING') throw new ConflictException('Only pending requests can be deleted.');

        await this.prisma.vacationRequest.delete({ where: { id: requestId } });
        return { message: 'Vacation request deleted successfully.' };
    }












    //Private Helpers Methods to manage vacation module
    // Get user vacation balance for a year, only for status APPROVED or REJECTED
    private async getUserVacationBalance(userId: string, year: number) {
        let balance = await this.prisma.vacationBalance.findFirst({
            where: { userId, year }
        });
        if (!balance) {
            balance = await this.prisma.vacationBalance.create({
                data: {
                    userId,
                    year,
                    daysAvailable: 15,
                    daysTaken: 0,
                    daysOwed: 0
                }
            })
        }
        return balance;
    }

    // Calculate vacation values and observation, only for status APPROVED or REJECTED
    private calculateVacationValues(daysRequested: number, balance: { daysTaken: number, daysAvailable: number }, observationBase?: string) {
        const daysUsed = balance.daysTaken || 0;
        const daysAvailable = balance.daysAvailable || 0;
        const daysRemaining = Math.max(0, daysAvailable - daysUsed);
        const daysAssigned = daysRequested
        const daysExceeded = Math.max(0, daysUsed - daysAvailable);
        let observation = observationBase || '';
        if (daysExceeded > 0) {
            observation += ` [EXCEDE LÍMITE: Solicita ${daysRequested}, disponibles ${daysRemaining}. Exceso: ${daysExceeded} días]`;
        } else {
            observation += ` [LÍMITE: Usado ${daysUsed}/${daysAvailable} días. Quedarán ${daysRemaining} días disponibles]`;
        }
        return { daysUsed, daysAvailable, daysRemaining, daysAssigned, daysExceeded, observation };
    }

    // Calculate vacation values and observation, only for status PENDING
    private calculateVacationValuesWithPending(
        daysRequested: number,
        projected: { daysAvailable: number, daysUsed: number, daysPending: number, daysProjected: number, daysOwed: number },
        observationBase?: string
    ) {
        const { daysAvailable, daysUsed, daysPending, daysProjected, daysOwed } = projected;

        const totalAfterRequest = daysUsed + daysPending + daysRequested;
        const daysRemaining = Math.max(0, daysAvailable - totalAfterRequest);
        const daysAssigned = Math.min(daysRequested, daysAvailable - daysUsed);
        const daysExceeded = Math.max(0, daysRequested - (daysAvailable - daysUsed));
        let observation = observationBase || '';

        if (daysExceeded > 0) {
            observation += ` [EXCEDE LÍMITE: Solicita ${daysRequested}, usados+pendientes ${totalAfterRequest}/${daysAvailable}. Exceso: ${daysExceeded} días]`;
        } else {
            observation += ` [LÍMITE: Usado+Pendiente ${totalAfterRequest}/${daysAvailable} días. Quedarán ${daysRemaining} días disponibles]`;
        }

        return { daysUsed, daysAvailable, daysRemaining, daysAssigned, daysExceeded, observation };
    }

    private async hasVacationInRange(userId: string, start: Date, end: Date): Promise<boolean> {
        const vacation = await this.prisma.vacationRequest.findFirst({
            where: {
                userId,
                OR: [
                    {
                        startDate: { lte: end },
                        endDate: { gte: start },
                    }
                ]
            },
        });

        return !!vacation;
    }

    private calculateDaysInRange(start: Date, end: Date): number {
        const msInDay = 1000 * 60 * 60 * 24;
        const diffMs = end.getTime() - start.getTime();
        return Math.ceil((diffMs + 1000) / msInDay);
    }

    private async hasVacationRequestPending(userId: string, start: Date): Promise<boolean> {
        const year = start.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31);

        const pendingRequest = await this.prisma.vacationRequest.findFirst({
            where: {
                userId,
                status: 'PENDING',
                startDate: { gte: startOfYear, lte: endOfYear }
            }
        });

        return !!pendingRequest;
    }

    private splitDaysByYear(start: Date, end: Date): Record<number, number> {
        const result: Record<number, number> = {};
        let current = new Date(start)
        while (current <= end) {
            const year = current.getFullYear();
            if (!result[year]) result[year] = 0;
            result[year]++;
            current.setDate(current.getDate() + 1);
        }
        return result;
    }




    private async approveVacationRequest(request, approverId: string, observation?: string,): Promise<VacationRequestResponse> {
        const daysByYear = this.splitDaysByYear(request.startDate, request.endDate);

        const year = request.startDate.getFullYear();
        const balance = await this.getUserVacationBalance(request.userId, year);

        for (const [yearStr, daysInYear] of Object.entries(daysByYear)) {
            await this.settleBalancePerYear(request.userId, Number(yearStr), daysInYear);
        }

        const updatedRequest = await this.prisma.vacationRequest.update({
            where: { id: request.id },
            data: {
                status: 'APPROVED',
                observation: this.buildObservation(request.observation, observation, 'APROBADA')
            }
        });

        await this.prisma.vacationActionLog.create({
            data: {
                vacationRequestId: request.id,
                action: 'APPROVED',
                actionById: approverId,
                comment: observation

            }
        })


        const calc = this.calculateVacationValues(request.daysRequested, balance, updatedRequest.observation ?? undefined);

        return {
            ...updatedRequest,
            startDate: updatedRequest.startDate.toISOString(),
            endDate: updatedRequest.endDate.toISOString(),
            ...calc,
            status: updatedRequest.status as VacationRequestStatus
        }
    }


    private async rejectVacationRequest(request, approverId: string, observation?: string): Promise<VacationRequestResponse> {
        const updatedRequest = await this.prisma.vacationRequest.update({
            where: { id: request.id },
            data: {
                status: 'REJECTED',
                observation: this.buildObservation(request.observation, observation, 'RECHAZADA')
            }
        });

        await this.prisma.vacationActionLog.create({
            data: {
                vacationRequestId: request.id,
                action: 'REJECTED',
                actionById: approverId,
                comment: observation

            }
        })

        const year = request.startDate.getFullYear();
        const balance = await this.getUserVacationBalance(request.userId, year);
        const calc = this.calculateVacationValues(request.daysRequested, balance, updatedRequest.observation ?? undefined);

        return {
            ...updatedRequest,
            startDate: updatedRequest.startDate.toISOString(),
            endDate: updatedRequest.endDate.toISOString(),
            ...calc,
            status: updatedRequest.status as VacationRequestStatus
        }
    }


    private async settleBalancePerYear(userId: string, year: number, daysAssigned: number) {
        let balance = await this.prisma.vacationBalance.findFirst({
            where: { userId, year }
        });

        if (!balance) {
            balance = await this.prisma.vacationBalance.create({
                data: {
                    userId,
                    year,
                    daysAvailable: 15,
                    daysTaken: 0,
                    daysOwed: 0
                }
            });
        }

        const newDaysTaken = balance.daysTaken + daysAssigned;
        let daysOwed = balance.daysOwed || 0;
        let daysExceeded = 0;
        if (newDaysTaken > balance.daysAvailable) {
            daysExceeded = newDaysTaken - balance.daysAvailable;
            daysOwed += daysExceeded;
        }

        await this.prisma.vacationBalance.update({
            where: { id: balance.id },
            data: {
                daysTaken: Math.min(newDaysTaken, balance.daysAvailable),
                daysOwed
            }
        });
    }


    private buildObservation(original?: string, extra?: string, statusMsg?: string): string {
        let obs = original || '';
        if (extra) obs += `[OBS: ${extra}]`;
        if (statusMsg) obs += `[ESTADO: ${statusMsg}]`;
        return obs;
    }
}
