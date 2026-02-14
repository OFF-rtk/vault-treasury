import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Query,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountFiltersDto, UpdateLimitsDto, RequestLimitChangeDto } from './dto/account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SentinelGuard } from '../sentinel/sentinel.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) { }

    @Get()
    async findAll(@Query() filters: AccountFiltersDto) {
        return this.accountsService.findAll(filters);
    }

    @Get('stats')
    async getLiquidityStats() {
        return this.accountsService.getLiquidityStats();
    }

    @Get('pending-request-counts')
    async getPendingRequestCounts() {
        return this.accountsService.getPendingRequestCounts();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.accountsService.findOne(id);
    }

    @Get(':id/limit-requests')
    async getPendingLimitRequests(@Param('id') id: string) {
        return this.accountsService.getPendingLimitRequests(id);
    }

    @Post(':id/limit-request')
    @UseGuards(SentinelGuard)
    @HttpCode(HttpStatus.CREATED)
    async requestLimitChange(
        @Param('id') id: string,
        @Request() req,
        @Body() body: RequestLimitChangeDto,
    ) {
        return this.accountsService.requestLimitChange(id, req.user.userId, body);
    }

    @Patch(':id/limits')
    @UseGuards(RolesGuard, SentinelGuard)
    @Roles('treasury_admin')
    @HttpCode(HttpStatus.OK)
    async updateLimits(
        @Param('id') id: string,
        @Request() req,
        @Body() body: UpdateLimitsDto,
    ) {
        return this.accountsService.updateLimits(id, req.user.userId, body);
    }
}
