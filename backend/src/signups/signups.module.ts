import { Module } from '@nestjs/common';
import { SignupsController } from './signups.controller';
import { SignupsService } from './signups.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [SignupsController],
    providers: [SignupsService],
    exports: [SignupsService],
})
export class SignupsModule { }
