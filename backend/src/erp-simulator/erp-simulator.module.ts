import { Module } from '@nestjs/common';
import { ErpSimulatorController } from './erp-simulator.controller';
import { ErpSimulatorService } from './erp-simulator.service';

@Module({
    controllers: [ErpSimulatorController],
    providers: [ErpSimulatorService],
    exports: [ErpSimulatorService],
})
export class ErpSimulatorModule { }
