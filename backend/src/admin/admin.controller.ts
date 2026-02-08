import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('users')
    findAllUsers() {
        return { module: 'admin', endpoint: 'users', status: 'ok', data: [] };
    }
}
