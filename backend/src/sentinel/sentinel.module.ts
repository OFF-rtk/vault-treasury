import { Module, forwardRef } from '@nestjs/common';
import { SentinelService } from './sentinel.service';
import { SentinelController } from './sentinel.controller';
import { SentinelGuard } from './sentinel.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [forwardRef(() => AuthModule)],
    controllers: [SentinelController],
    providers: [SentinelService, SentinelGuard],
    exports: [SentinelService, SentinelGuard],
})
export class SentinelModule { }
