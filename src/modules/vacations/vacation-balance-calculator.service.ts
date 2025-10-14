import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class VacationBalanceCalculatorService {
    constructor(private readonly prisma: PrismaService) { }

    async getProjectedBalance(userId: string, year: number, excludeRequestId?: string) {
        const balance = await this.prisma.vacationBalance.findFirst({
            where: {userId, year}
        });

        const daysAvailable = balance?.daysAvailable || 0;
        const daysUsed = balance?.daysTaken || 0;

        const pendingRequests = await this.prisma.vacationRequest.findMany({
            where: {
                userId,
                status: 'PENDING',
                startDate: {
                    gte: new Date(year, 0, 1),
                    lte: new Date(year, 11, 31)
                },
                ...(excludeRequestId ? { id: { not: excludeRequestId } } : {})
            }
        });

        const daysPending = pendingRequests.reduce((sum, req) => sum + req.daysRequested, 0);

        const daysProjected = daysUsed + daysPending;
        const daysOwed = Math.max(0, daysProjected - daysAvailable);

        return {
            daysAvailable,
            daysUsed,
            daysPending,
            daysProjected,
            daysOwed
        }
    }
}