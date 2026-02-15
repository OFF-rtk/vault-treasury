import { Module } from '@nestjs/common';
import { ErpSimulatorController } from './erp-simulator.controller';
import { ErpSimulatorService } from './erp-simulator.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SentinelModule } from '../sentinel/sentinel.module';

@Module({
    imports: [DatabaseModule, AuthModule, SentinelModule],
    controllers: [ErpSimulatorController],
    providers: [ErpSimulatorService],
    exports: [ErpSimulatorService],
})
export class ErpSimulatorModule { }
