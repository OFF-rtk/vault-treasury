import { Controller, Get, Post, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService, PendingUser } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('treasury_admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('pending-users')
    async getPendingUsers(): Promise<PendingUser[]> {
        return this.adminService.getPendingUsers();
    }

    @Post('users/:id/approve')
    @HttpCode(HttpStatus.OK)
    async approveUser(
        @Param('id') userId: string,
        @Request() req,
    ): Promise<{ message: string }> {
        return this.adminService.approveUser(userId, req.user.userId);
    }

    @Post('users/:id/reject')
    @HttpCode(HttpStatus.OK)
    async rejectUser(
        @Param('id') userId: string,
        @Request() req,
    ): Promise<{ message: string }> {
        return this.adminService.rejectUser(userId, req.user.userId);
    }
}
