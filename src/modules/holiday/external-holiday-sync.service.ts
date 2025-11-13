import { Injectable, Logger } from "@nestjs/common";

import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
import { CreateHolidayDto } from "./dto/create-holiday.dto";


@Injectable()
export class ExternalHolidayService {

    private readonly logger = new Logger(ExternalHolidayService.name)
    private readonly holidaysUrl: string

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {
        this.holidaysUrl = this.configService.get<string>('HOLIDAYS_EXTERNAL_URL') || 'http://172.32.1.57:5678/webhook/feriados'
    }


    async fetchExternalHolidays(year: number): Promise<any[]> {
        const url = `${this.holidaysUrl}?year=${year}`;

        try {
            const response = await lastValueFrom(this.httpService.get(url))

            return response.data.data.feriados

        } catch (error) {
            this.logger.error(`Error fetching holidays for year ${year}: ${error.message}`);
            throw error;

        }

    }

    formatToHolidaysDtos(feriados: any[], year: number): CreateHolidayDto[] {
        const grouped: Record<string, string[]> = {};
        for (const f of feriados) {
            const key = `${f.evento}-${year}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(f.fecha_efectiva);
        }

        return Object.entries(grouped).map(([key, fechas]) => {
            fechas.sort();
            const name = key.split('-')[0];
            // Filtra los feriados de este evento y año
            const eventFeriados = feriados.filter(f => f.evento === name && fechas.includes(f.fecha_efectiva));
            // Formatea las observaciones
            const observation = eventFeriados.map(f =>
                `Fecha real: ${f.fecha_real}` +
                (f.fecha_traslado && f.fecha_traslado !== '-' ? ` | Traslado: ${f.fecha_traslado}` : '') +
                (f.observaciones && f.observaciones !== '-' ? ` | ${f.observaciones}` : '')
            ).join('\n');

            return {
                name,
                startDate: this.toUtcEcuadorStart(fechas[0]),
                endDate: this.toUtcEcuadorEnd(fechas[fechas.length - 1]),
                observation,
            }
        });
    }


    private toUtcEcuadorStart(dateStr: string): string {
        return new Date(`${dateStr}T05:00:00.000Z`).toISOString();
    }

    private toUtcEcuadorEnd(dateStr: string): string {
        const date = new Date(`${dateStr}T05:00:00.000Z`);
        date.setUTCDate(date.getUTCDate() + 1);
        date.setUTCHours(4, 59, 59, 999);
        return date.toISOString();
    }
}