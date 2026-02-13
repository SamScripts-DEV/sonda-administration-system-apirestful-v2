import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShiftAssignmentBatchDto } from './dto/shift-assignment-batch.dto';
import { Prisma } from '@prisma/client';
import { ShiftAssignmentSingleDto } from './dto/shift-assignment-single.dto';
import { truncate } from 'fs';
import { ShiftAssignmentCalendarResponse, formatShiftAssignmentCalendar } from './types/shift-assignment-types';



@Injectable()
export class ShiftAssignmentService {

    constructor(
        private readonly prisma: PrismaService,
    ) { }




    //Function to enter into the DB the assignment of shifts for each user given a specific range and perform bulk insertion
    async assignBatch(dto: ShiftAssignmentBatchDto): Promise<ShiftAssignmentCalendarResponse[]> {
        await this.validateAreaExists(dto.areaId)
        await this.validateRosterAndArea(dto.shiftRosterId, dto.areaId)

        const uniqueShiftIds = [...new Set(dto.assignments.map(a => a.shiftId))]
        const uniqueDates = [...new Set(dto.assignments.map(a => a.date))]

        const [schedulesMap, holidaysSet] = await Promise.all([
            this.loadSchedulesMap(uniqueShiftIds),
            this.loadHolidaysSet(uniqueDates)
        ])

        const data: Prisma.ShiftAssignmentCreateManyInput[] = dto.assignments.map(a => {

            const dateObj = new Date(a.date);
            const dateStr = dateObj.toISOString().split('T')[0];

            return {
                userId: a.userId,
                shiftTypeId: a.shiftId,
                date: dateObj,
                areaId: dto.areaId,
                shiftRosterId: dto.shiftRosterId,
                isHoliday: holidaysSet.has(dateStr),
                isWeekend: this.isWeekend(dateObj)
            }

        });

        return this.prisma.$transaction(async (tx) => {
            const insertedAssignments = await tx.shiftAssignment.createManyAndReturn({
                data,
                skipDuplicates: true
            })

            if (insertedAssignments.length === 0) {
                return []
            }

            const shiftHoursData: Prisma.ShiftHoursCreateManyInput[] = [];
            const shiftsEventsData: Prisma.ShiftEventCreateManyInput[] = [];

            for (const assignment of insertedAssignments) {
                const schedule = schedulesMap.get(assignment.shiftTypeId);
                const worked = schedule
                    ? this.calculateWorkedHours(schedule.startTime, schedule.endTime)
                    : 0;

                shiftHoursData.push({
                    shiftAssignmentId: assignment.id,
                    worked,
                    ordinary: worked,
                    extra: 0,
                    supplementary: 0
                });

                shiftsEventsData.push({
                    shiftAssignmentId: assignment.id,
                    userId: assignment.userId,
                    eventType: 'CREATE',
                    observation: null
                })
            }

            await Promise.all([
                tx.shiftHours.createMany({ data: shiftHoursData }),
                tx.shiftEvent.createMany({ data: shiftsEventsData })
            ])

            const fullAssignments = await tx.shiftAssignment.findMany({
                where: {
                    id: { in: insertedAssignments.map(a => a.id) }
                },
                include: this.getShiftAssignmentInclude()
            });

            return fullAssignments.map(formatShiftAssignmentCalendar);
        })

    }

    async assignSingle(dto: ShiftAssignmentSingleDto): Promise<ShiftAssignmentCalendarResponse> {
        await this.validateAreaExists(dto.areaId)
        await this.validateRosterAndArea(dto.shiftRosterId, dto.areaId)
        await this.validateUserExists(dto.userId)
        await this.validateShiftTypeExists(dto.shiftId)

        const dateObj = new Date(dto.date)
        const dateStr = dateObj.toISOString().split('T')[0]

        const holidaysSet = await this.loadHolidaysSet([dto.date])
        const isHoliday = holidaysSet.has(dateStr);
        const isWeekend = this.isWeekend(dateObj)

        await this.validateUserHasNoAssignmentOnDate(dto.userId, dateObj)

        return this.prisma.$transaction(async (tx) => {
            const assignment = await tx.shiftAssignment.create({
                data: {
                    userId: dto.userId,
                    shiftTypeId: dto.shiftId,
                    date: dateObj,
                    areaId: dto.areaId,
                    isHoliday,
                    isWeekend

                }
            });

            const schedule = await tx.shiftSchedule.findFirst({
                where: { shiftTypeId: dto.shiftId },
                select: { startTime: true, endTime: true }
            })

            const worked = schedule
                ? this.calculateWorkedHours(schedule.startTime, schedule.endTime)
                : 0

            await this.createShiftHours(tx, assignment.id, worked);
            await this.createShiftEvent(tx, assignment.id, assignment.userId, 'CREATE')

            const fullAssignment = await tx.shiftAssignment.findUnique({
                where: { id: assignment.id },
                include: this.getShiftAssignmentInclude()
            })

            return formatShiftAssignmentCalendar(fullAssignment)
        })


    }

    async updateAssignment(
        assignmentId: string,
        dto: Partial<ShiftAssignmentSingleDto>
    ): Promise<ShiftAssignmentCalendarResponse> {

        const existingAssignment = await this.prisma.shiftAssignment.findUnique({
            where: { id: assignmentId }
        });
        if (!existingAssignment) throw new NotFoundException('Shift assignment not found')


        if (dto.areaId) await this.validateAreaExists(dto.areaId)
        const areaId = dto.areaId || existingAssignment.areaId

            
        if (dto.shiftRosterId) await this.validateRosterAndArea(dto.shiftRosterId, areaId)
        if (dto.userId) await this.validateUserExists(dto.userId)
        if (dto.shiftId) await this.validateShiftTypeExists(dto.shiftId)

        const newDate = dto.date ? new Date(dto.date) : existingAssignment.date
        const newUserId = dto.userId || existingAssignment.userId

        if (dto.date || dto.userId) await this.validateUserHasNoAssignmentOnDate(newUserId, newDate, assignmentId)


        let isHoliday = existingAssignment.isHoliday
        let isWeekend = existingAssignment.isWeekend
        if (dto.date) {
            const dateStr = newDate.toISOString().split('T')[0]
            const holidaysSet = await this.loadHolidaysSet([dto.date])
            const isHoliday = holidaysSet.has(dateStr)
            const isWeekend = this.isWeekend(newDate)


        }

        const data = {
            userId: newUserId,
            shiftTypeId: dto.shiftId ?? existingAssignment.shiftTypeId,
            date: newDate,
            areaId: dto.areaId ?? existingAssignment.areaId,
            shiftRosterId: dto.shiftRosterId ?? existingAssignment.shiftRosterId,
            isHoliday,
            isWeekend
        };




        return this.prisma.$transaction(async (tx) => {

            const updatedAssignment = await tx.shiftAssignment.update({
                where: { id: assignmentId },
                data
            })

            const schedule = await tx.shiftSchedule.findFirst({
                where: { shiftTypeId: data.shiftTypeId },
                select: { startTime: true, endTime: true }
            })

            const worked = schedule
                ? this.calculateWorkedHours(schedule.startTime, schedule.endTime)
                : 0

            const existingHours = await tx.shiftHours.findFirst({
                where: { shiftAssignmentId: assignmentId }
            })

            if (existingHours) {
                await tx.shiftHours.update({
                    where: { id: existingHours.id },
                    data: {
                        worked,
                        ordinary: worked,
                        extra: 0,
                        supplementary: 0
                    }
                })
            } else {
                await this.createShiftHours(tx, assignmentId, worked);

            }

            await this.createShiftEvent(tx, assignmentId, data.userId, 'UPDATE')

            const fullAssignment = await tx.shiftAssignment.findUnique({
                where: { id: updatedAssignment.id },
                include: this.getShiftAssignmentInclude()
            })

            return formatShiftAssignmentCalendar(fullAssignment)
        })
    }

    async reassignShiftAsExtra(
        assignmentId: string,
        newUserId: string,
        observation?: string
    ): Promise<ShiftAssignmentCalendarResponse> {
        const assignment = await this.prisma.shiftAssignment.findUnique({
            where: { id: assignmentId }
        })
        if (!assignment) throw new NotFoundException('Shift assignment not found')
        await this.validateUserExists(newUserId)

        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.shiftAssignment.update({
                where: { id: assignmentId },
                data: {
                    userId: newUserId,
                    isExtra: true,
                    originalUserId: assignment.userId,
                    observation: observation || null
                }
            })

            await this.createShiftEvent(
                tx,
                assignmentId,
                newUserId,
                'EXTRA-REASSIGN',
                observation || 'Turno reasignado como extra'
            )

            const fullAssignment = await tx.shiftAssignment.findUnique({
                where: { id: updated.id },
                include: this.getShiftAssignmentInclude()
            })

            return  formatShiftAssignmentCalendar(fullAssignment)
        })
    }

    async findAllAssignments(month: number, year: number): Promise<ShiftAssignmentCalendarResponse[]> {

        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 999)
        const assignments = await this.prisma.shiftAssignment.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: this.getShiftAssignmentInclude()
        });

        return assignments.map(formatShiftAssignmentCalendar)
    }

    async findOneAssignment(id: string): Promise<ShiftAssignmentCalendarResponse> {
        const assignment = await this.prisma.shiftAssignment.findUnique({
            where: { id },
            include: this.getShiftAssignmentInclude()
        });

        if (!assignment) throw new NotFoundException('Shift assignment not found');

        return formatShiftAssignmentCalendar(assignment)
    }

    async deleteAssignment(assignmentId: string, deletedByUserId: string): Promise<{ message: string }> {

        const assignment = await this.prisma.shiftAssignment.findUnique({
            where: { id: assignmentId }
        })

        await this.prisma.$transaction(async (tx) => {
            await tx.shiftAssignment.delete({
                where: { id: assignmentId }
            })

            await this.createShiftEvent(
                tx,
                assignmentId,
                deletedByUserId,
                'DELETE',
                'Shift assignment deleted'
            )
        })

        return { message: 'Shift assignment deleted successfully' }
    }



    //----------------------------------------------------------------------------------
    //VALIDACIONES
    //----------------------------------------------------------------------------------

    //Valida que el area exista
    private async validateAreaExists(areaId: string): Promise<void> {
        const area = await this.prisma.area.findUnique({
            where: { id: areaId }
        })

        if (!area) {
            throw new NotFoundException("Area for assignments not found");
        }
    }

    //Valida que el usuario exista
    private async validateUserExists(userId: string): Promise<void> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } })
        if (!user) throw new NotFoundException('User not found');
    }

    //Valida que el tipo de turno exista
    private async validateShiftTypeExists(shiftTypeId: string): Promise<void> {
        const shiftType = await this.prisma.shiftType.findUnique({ where: { id: shiftTypeId } })
        if (!shiftType) throw new NotFoundException('Shift type not found')
    }

    //Valida que el usuario no tenga ya un turno asignado en la fecha indicada
    private async validateUserHasNoAssignmentOnDate(userId: string, date: Date, excludedAssignmentId?: string): Promise<void> {
        const where: any = {
            userId,
            date,
        }
        if (excludedAssignmentId) {
            where.id = { not: excludedAssignmentId }
        }
        const existing = await this.prisma.shiftAssignment.findFirst({ where })
        if (existing) {
            throw new NotFoundException('User already has a shift assignment on this date');
        }
    }

    //Valida el area del Roster

    private async validateRosterAndArea(rosterId: string, areaId: string): Promise<void> {
        if (!rosterId) return

        const roster = await this.prisma.shiftRoster.findUnique({
            where: { id: rosterId }
        })
        if (!roster) {
            throw new NotFoundException('Shift roster not found')
        }
        if (roster.areaId !== areaId) {
            throw new NotFoundException('ShiftRoster area does not match assignment area')
        }
    }



    //----------------------------------------------------------------------------------
    //CARGA DE DATOS AUXILIARES PARA LAS FUNCIONES PRINCIPALES
    //----------------------------------------------------------------------------------


    //Carga los horarios de los tipos de turno indicados y los retorna en un Map
    private async loadSchedulesMap(shiftTypeIds: string[]): Promise<Map<string, { startTime: string, endTime: string }>> {
        const schedules = await this.prisma.shiftSchedule.findMany({
            where: {
                shiftTypeId: { in: shiftTypeIds }
            },
            select: {
                shiftTypeId: true,
                startTime: true,
                endTime: true
            }
        })

        return new Map(
            schedules.map(s => [
                s.shiftTypeId,
                { startTime: s.startTime, endTime: s.endTime }
            ])
        )
    }

    //CArga los días feriados en el rango de fechas indicado y los retorna como Set de strings
    private async loadHolidaysSet(dates: string[]): Promise<Set<string>> {
        const dateObjects = dates.map(d => new Date(d));

        const minDate = new Date(Math.min(...dateObjects.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dateObjects.map(d => d.getTime())));

        const holidays = await this.prisma.holiday.findMany({
            where: {
                OR: [
                    {
                        startDate: { lte: maxDate },
                        endDate: { gte: minDate }
                    }
                ]
            },
            select: {
                startDate: true,
                endDate: true
            }
        })

        const holidayDates = new Set<string>();

        for (const date of dateObjects) {
            const dateStr = date.toISOString().split('T')[0];

            const isHoliday = holidays.some(h =>
                date >= h.startDate && date <= h.endDate
            )

            if (isHoliday) {
                holidayDates.add(dateStr);
            }
        }

        return holidayDates
    }


    //---------------------------------------------------------------------------------
    //CALCULOS Y LOGICA DE NEGOCIO
    //---------------------------------------------------------------------------------

    //Función para determinar si una fecha es fin de semana
    private isWeekend(date: Date): boolean {
        const day = date.getDay();
        return day === 5 || day === 6;
    }

    //Calcula las horas trabajadas entre dos horarios
    public calculateWorkedHours(start: string, end: string): number {
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);

        let hours = (h2 + m2 / 60) - (h1 + m1 / 60);
        if (hours < 0) hours += 24;

        return hours;
    }


    //---------------------------------------------------------------------------------
    //REGISTRO DE EVENTOS Y HORAS
    //---------------------------------------------------------------------------------


    //Crear un evento de turno para trazabilidad
    public async createShiftEvent(tx: Prisma.TransactionClient, shiftAssignmentId: string, userId: string, eventType: string, observation?: string) {
        return tx.shiftEvent.create({
            data: {
                shiftAssignmentId,
                userId,
                eventType,
                observation,
            }
        })
    }

    //Crea el registro de horas trabajadas para un turno
    public async createShiftHours(tx: Prisma.TransactionClient, shiftAssignmentId: string, worked: number) {
        return tx.shiftHours.create({
            data: {
                shiftAssignmentId,
                worked,
                ordinary: worked,
                extra: 0,
                supplementary: 0
            }
        })
    }


    private getShiftAssignmentInclude() {
        return {
            shiftType: {
                include: {
                    schedules: true
                }
            },
            user: true,
            area: true,
            shiftRoster: true
        }
    }












}
