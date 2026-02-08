import { Controller, Get, Post } from '@nestjs/common';
import { ErpSimulatorService } from './erp-simulator.service';

@Controller('erp-simulator')
export class ErpSimulatorController {
    constructor(private readonly erpSimulatorService: ErpSimulatorService) { }

    @Get('config')
    getConfig() {
        return { module: 'erp-simulator', status: 'ok', config: {} };
    }

    @Post('start')
    start() {
        return { module: 'erp-simulator', action: 'start', status: 'ok' };
    }

    @Post('stop')
    stop() {
        return { module: 'erp-simulator', action: 'stop', status: 'ok' };
    }
}
