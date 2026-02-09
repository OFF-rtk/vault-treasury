import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SignupsService, SignupResponse } from './signups.service';
import { CreateSignupDto } from './dto/create-signup.dto';

@Controller('signups')
export class SignupsController {
    constructor(private readonly signupsService: SignupsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createSignupDto: CreateSignupDto): Promise<SignupResponse> {
        return this.signupsService.create(createSignupDto);
    }
}
