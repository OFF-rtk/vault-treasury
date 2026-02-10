import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentFiltersDto, ApprovePaymentDto, RejectPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SentinelGuard } from '../sentinel/sentinel.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Get()
    async findAll(@Query() filters: PaymentFiltersDto) {
        return this.paymentsService.findAll(filters);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.paymentsService.findOne(id);
    }

    @Post(':id/approve')
    @UseGuards(SentinelGuard)
    @HttpCode(HttpStatus.OK)
    async approve(
        @Param('id') id: string,
        @Request() req,
        @Body() body: ApprovePaymentDto,
    ) {
        return this.paymentsService.approve(id, req.user.userId, body.notes);
    }

    @Post(':id/reject')
    @UseGuards(SentinelGuard)
    @HttpCode(HttpStatus.OK)
    async reject(
        @Param('id') id: string,
        @Request() req,
        @Body() body: RejectPaymentDto,
    ) {
        return this.paymentsService.reject(id, req.user.userId, body.reason);
    }
}
