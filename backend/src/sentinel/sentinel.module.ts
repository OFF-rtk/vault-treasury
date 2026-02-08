import { Module } from '@nestjs/common';
import { SentinelService } from './sentinel.service';

@Module({
    providers: [SentinelService],
    exports: [SentinelService],
})
export class SentinelModule { }
