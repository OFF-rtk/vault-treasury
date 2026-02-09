import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateSignupDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    password: string;

    @IsString()
    @MinLength(2)
    fullName: string;

    @IsString()
    @IsOptional()
    department?: string;
}
