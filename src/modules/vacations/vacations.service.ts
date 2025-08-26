import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVacationDto } from './dto/create-vacation.dto';
import { VacationRequestResponse, VacationRequestStatus } from './types/vacations-types';

@Injectable()
export class VacationsService {
    constructor(private readonly prisma: PrismaService) { }

    //GET method to get vacation requests

    async getVacationRequestById(requestId: string): Promise<VacationRequestResponse | null> {
        const req = await this.prisma.vacationRequest.findUnique({ where: { id: requestId } });
        if (!req) return null;

        const year = req.startDate.getFullYear();
        const balance = await this.getUserVacationBalance(req.userId, year);
        const calc = this.calculateVacationValues(req.daysRequested, balance, req.observation ?? undefined);

        return {
            ...req,
            startDate: req.startDate.toISOString(),
            endDate: req.endDate.toISOString(),
            ...calc,
            status: req.status as VacationRequestStatus
        };
    }


    async getVacationRequests(userId: string): Promise<VacationRequestResponse[]> {
        const requests = await this.prisma.vacationRequest.findMany({ where: { userId } });

        return Promise.all(requests.map(async req => {
            const year = req.startDate.getFullYear();
            const balance = await this.getUserVacationBalance(userId, year);
            const calc = this.calculateVacationValues(req.daysRequested, balance, req.observation ?? undefined);

            return {
                ...req,
                startDate: req.startDate.toISOString(),
                endDate: req.endDate.toISOString(),
                ...calc,
                status: req.status as VacationRequestStatus
            };
        }));
    }

    //POST method to create a vacation
    async generateVacationRequest(vacationRequest: CreateVacationDto, userAuth: { id: string }): Promise<VacationRequestResponse> {
        const { userId, startDate, endDate } = vacationRequest;
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (await this.hasVacationRequestPending(userId, start)) {
            throw new ConflictException('User already has a pending vacation request for this year.');
        }

        if (await this.hasVacationInRange(userId, start, end)) {
            throw new ConflictException('Vacation request overlaps with existing vacation.');
        }

        const daysRequested = this.calculateDaysInRange(start, end);
        const year = start.getFullYear();
        const balance = await this.getUserVacationBalance(userId, year);
        const {
            daysUsed,
            daysAvailable,
            daysRemaining,
            daysAssigned,
            daysExceeded,
            observation
        } = this.calculateVacationValues(daysRequested, balance, vacationRequest.observation);

        const newRequestVacation = await this.prisma.vacationRequest.create({
            data: {
                userId,
                createdById: userAuth.id,
                startDate: start,
                endDate: end,
                daysRequested,
                observation,
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

    



    //Private Helpers Methods to manage vacation module
    // Get user vacation balance for a year
    private async getUserVacationBalance(userId: string, year: number) {
        const balance = await this.prisma.vacationBalance.findFirst({
            where: { userId, year }
        });
        return balance || { daysTaken: 0, daysAvailable: 0 };
    }

    // Calculate vacation values and observation
    private calculateVacationValues(daysRequested: number, balance: { daysTaken: number, daysAvailable: number }, observationBase?: string) {
        const daysUsed = balance.daysTaken || 0;
        const daysAvailable = balance.daysAvailable || 0;
        const daysRemaining = Math.max(0, daysAvailable - daysUsed);
        const daysAssigned = Math.min(daysRequested, daysRemaining);
        const daysExceeded = Math.max(0, daysRequested - daysRemaining);
        let observation = observationBase || '';
        if (daysExceeded > 0) {
            observation += ` [EXCEDE LÍMITE: Solicita ${daysRequested}, disponibles ${daysRemaining}. Exceso: ${daysExceeded} días]`;
        } else {
            observation += ` [LÍMITE: Usado ${daysUsed}/${daysAvailable} días. Quedarán ${daysRemaining - daysRequested} días disponibles]`;
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
        const days = Math.ceil(
            (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1
        );

        return days;
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




}
