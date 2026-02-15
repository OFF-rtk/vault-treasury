import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health.controller';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module';
import { AccountsModule } from './accounts/accounts.module';
import { SignupsModule } from './signups/signups.module';
import { AdminModule } from './admin/admin.module';
import { ErpSimulatorModule } from './erp-simulator/erp-simulator.module';
import { SentinelModule } from './sentinel/sentinel.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    PaymentsModule,
    AccountsModule,
    SignupsModule,
    AdminModule,
    ErpSimulatorModule,
    SentinelModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule { }
