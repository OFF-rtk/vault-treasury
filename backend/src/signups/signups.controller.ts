import { Controller, Get, Post, Body } from '@nestjs/common';
import { SignupsService } from './signups.service';

@Controller('signups')
export class SignupsController {
    constructor(private readonly signupsService: SignupsService) { }

    @Get()
    findAll() {
        return { module: 'signups', status: 'ok', data: [] };
    }

    @Post()
    create(@Body() createSignupDto: any) {
        return { module: 'signups', status: 'ok', action: 'created' };
    }
}
