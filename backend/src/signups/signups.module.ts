import { Module } from '@nestjs/common';
import { SignupsController } from './signups.controller';
import { SignupsService } from './signups.service';

@Module({
    controllers: [SignupsController],
    providers: [SignupsService],
    exports: [SignupsService],
})
export class SignupsModule { }
