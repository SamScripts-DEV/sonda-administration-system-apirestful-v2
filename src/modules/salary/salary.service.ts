import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { SalaryHistory } from './types/salary-types';
import { encryptSalary, decryptSalary } from 'src/utils/salary-encryption.util';

@Injectable()
export class SalaryService {
    constructor(private readonly prisma: PrismaService) { }


    async createSalary(dto: CreateSalaryDto, user: string): Promise<SalaryHistory> {
        const newValidFrom = new Date(dto.validFrom);

        const prev = await this.prisma.salaryHistory.findFirst({
            where: {
                userId: dto.userId,
                validTo: { gte: newValidFrom }
            },
            orderBy: { validFrom: 'desc' }
        });

        if (prev) {
            const prevValidTo = new Date(newValidFrom.getTime() - 86400000);
            const prevValidToStr = prevValidTo.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            const newValidFromStr = newValidFrom.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            const adjustmentComment = `[AUTO] Fecha de término ajustada a ${prevValidToStr} por nuevo registro creado el ${newValidFromStr}`;
            await this.prisma.salaryHistory.update({
                where: { id: prev.id },
                data: {
                    validTo: prevValidTo,
                    comment: prev.comment
                        ? prev.comment + ' ' + adjustmentComment
                        : adjustmentComment,
                }
            });
        }

        await this.closePreviousSalaryRecord(dto.userId, newValidFrom);


        const encryptedAmount = encryptSalary(dto.amount);
        const record = await this.prisma.salaryHistory.create({
            data: {
                ...dto,
                currency: dto.currency || 'USD',
                amount: encryptedAmount,
                updatedBy: user,
                validFrom: new Date(dto.validFrom),
                validTo: dto.validTo ? new Date(dto.validTo) : undefined,
            }
        });
        return this.toResponse(record);
    }

    async getCurrentSalary(userId: string): Promise<SalaryHistory | null> {
        const now = new Date();
        const record = await this.prisma.salaryHistory.findFirst({
            where: {
                userId,
                validFrom: { lte: now },
                OR: [
                    { validTo: null },
                    { validTo: { gte: now } }
                ]
            },
            orderBy: { validFrom: 'desc' },
            include: {
                user: {
                    include: {
                        userTechnicalLevels: {
                            include: { technicalLevel: true }
                        }
                    }
                }
            }
        });
        return record ? this.toResponse(record) : null;
    }

    async getAllCurrentSalaries(): Promise<SalaryHistory[]> {
        const now = new Date();
        const records = await this.prisma.salaryHistory.findMany({
            where: {
                validFrom: { lte: now },
                OR: [
                    { validTo: null },
                    { validTo: { gte: now } }
                ]
            },
            orderBy: [
                { userId: "asc" },
                { validFrom: "desc" }
            ]
        });

        const latestByUser = new Map<string, SalaryHistory>();
        for (const record of records) {
            if (!latestByUser.has(record.userId)) {
                latestByUser.set(record.userId, this.toResponse(record));
            }
        }

        return Array.from(latestByUser.values());
    }


    async getSalaryHistory(userId: string): Promise<SalaryHistory[]> {
        const records = await this.prisma.salaryHistory.findMany({
            where: { userId },
            orderBy: { validFrom: 'asc' }
        });
        return records.map(this.toResponse);
    }


    async getSalaryAtDate(userId: string, date: Date): Promise<SalaryHistory | null> {
        const record = await this.prisma.salaryHistory.findFirst({
            where: {
                userId,
                validFrom: { lte: date },
                OR: [
                    { validTo: null },
                    { validTo: { gte: date } }
                ]
            },
            orderBy: { validFrom: 'desc' }
        });
        return record ? this.toResponse(record) : null;
    }


    async getSalariesInPeriod(userId: string, from: Date, to: Date): Promise<SalaryHistory[]> {
        const records = await this.prisma.salaryHistory.findMany({
            where: {
                userId,
                OR: [
                    { validFrom: { lte: to }, validTo: { gte: from } },
                    { validFrom: { gte: from, lte: to } },
                    { validTo: null, validFrom: { lte: to } }
                ]
            },
            orderBy: { validFrom: 'asc' }
        });
        return records.map(this.toResponse);
    }


    private toResponse(record: any): SalaryHistory {
        const technicalLevelName =
            record.user?.userTechnicalLevels?.[0]?.technicalLevel?.name;

        return {
            id: record.id,
            userId: record.userId,
            amount: decryptSalary(record.amount),
            currency: record.currency,
            validFrom: record.validFrom,
            validTo: record.validTo,
            comment: record.comment,
            updatedBy: record.updatedBy,
            technicalLevelName,
        };
    }


    private async closePreviousSalaryRecord(userId: string, newValidFrom: Date) {
        const prev = await this.prisma.salaryHistory.findFirst({
            where: { userId, validTo: null },
            orderBy: { validFrom: 'desc' }
        });
        if (prev) {
            await this.prisma.salaryHistory.update({
                where: { id: prev.id },
                data: { validTo: new Date(newValidFrom.getTime() - 86400000) } // 1 día antes
            });
        }
    }
}
