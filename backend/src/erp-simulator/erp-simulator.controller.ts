import { Controller, Get, Post, Patch, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ErpSimulatorService } from './erp-simulator.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SentinelGuard } from '../sentinel/sentinel.guard';
import { UpdateErpConfigDto } from './dto/erp-simulator.dto';

@Controller('erp-simulator')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('treasury_admin')
export class ErpSimulatorController {
    constructor(private readonly erpSimulatorService: ErpSimulatorService) { }

    @Get('config')
    async getConfig() {
        return this.erpSimulatorService.getConfig();
    }

    @Post('start')
    @UseGuards(SentinelGuard)
    @HttpCode(HttpStatus.OK)
    async start(@Request() req) {
        return this.erpSimulatorService.start(req.user.userId);
    }

    @Post('stop')
    @UseGuards(SentinelGuard)
    @HttpCode(HttpStatus.OK)
    async stop(@Request() req) {
        return this.erpSimulatorService.stop(req.user.userId);
    }

    @Patch('config')
    @UseGuards(SentinelGuard)
    @HttpCode(HttpStatus.OK)
    async updateConfig(
        @Body() dto: UpdateErpConfigDto,
        @Request() req,
    ) {
        return this.erpSimulatorService.updateConfig(dto, req.user.userId);
    }
}
