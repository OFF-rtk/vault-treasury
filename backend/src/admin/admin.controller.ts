import { Controller, Get, Post, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService, PendingUser, TreasuryUser } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SentinelGuard } from '../sentinel/sentinel.guard';
import { RejectLimitRequestDto } from '../accounts/dto/account.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('treasury_admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('pending-users')
    async getPendingUsers(): Promise<PendingUser[]> {
        return this.adminService.getPendingUsers();
    }

    @Get('users')
    async getAllUsers(): Promise<TreasuryUser[]> {
        return this.adminService.getAllUsers();
    }

    @Post('users/:id/approve')
    @UseGuards(SentinelGuard)
    @HttpCode(HttpStatus.OK)
    async approveUser(
        @Param('id') userId: string,
        @Request() req,
    ): Promise<{ message: string }> {
        return this.adminService.approveUser(userId, req.user.userId);
    }

    @Post('users/:id/reject')
    @UseGuards(SentinelGuard)
    @HttpCode(HttpStatus.OK)
    async rejectUser(
        @Param('id') userId: string,
        @Request() req,
    ): Promise<{ message: string }> {
        return this.adminService.rejectUser(userId, req.user.userId);
    }

    @Post('users/:id/deactivate')
    @UseGuards(SentinelGuard)
    @HttpCode(HttpStatus.OK)
    async deactivateUser(
        @Param('id') userId: string,
        @Request() req,
    ): Promise<{ message: string }> {
        return this.adminService.deactivateUser(userId, req.user.userId);
    }

    @Post('limit-requests/:id/approve')
    @UseGuards(SentinelGuard)
    @HttpCode(HttpStatus.OK)
    async approveLimitRequest(
        @Param('id') requestId: string,
        @Request() req,
    ): Promise<{ message: string }> {
        return this.adminService.approveLimitRequest(requestId, req.user.userId);
    }

    @Post('limit-requests/:id/reject')
    @UseGuards(SentinelGuard)
    @HttpCode(HttpStatus.OK)
    async rejectLimitRequest(
        @Param('id') requestId: string,
        @Request() req,
        @Body() body: RejectLimitRequestDto,
    ): Promise<{ message: string }> {
        return this.adminService.rejectLimitRequest(requestId, req.user.userId, body.reason);
    }
}
