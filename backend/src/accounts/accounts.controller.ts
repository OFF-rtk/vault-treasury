import {
    Controller,
    Get,
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
import { AccountFiltersDto, UpdateLimitsDto } from './dto/account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SentinelGuard } from '../sentinel/sentinel.guard';

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

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.accountsService.findOne(id);
    }

    @Patch(':id/limits')
    @UseGuards(SentinelGuard)
    @HttpCode(HttpStatus.OK)
    async updateLimits(
        @Param('id') id: string,
        @Request() req,
        @Body() body: UpdateLimitsDto,
    ) {
        return this.accountsService.updateLimits(id, req.user.userId, body);
    }
}
