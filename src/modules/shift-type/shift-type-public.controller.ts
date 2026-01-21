import { Body, Controller, Post } from "@nestjs/common";
import { ShiftTypeService } from "./shift-type.service";

@Controller('public/shift-type')
export class ShiftTypePublicController {
    constructor( private readonly shiftTypeService: ShiftTypeService ) {}

    @Post('info-shifts')
    async getBasicInfo(@Body() body: { ids: string[] }) {
        return this.shiftTypeService.findManyBasicinfoByIds(body.ids);
    }
}