import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// --- Query / Request DTOs ---

export class PaymentFiltersDto {
    @IsOptional()
    @IsIn(['pending', 'approved', 'rejected'])
    status?: string;

    @IsOptional()
    @IsIn(['low', 'normal', 'high', 'urgent'])
    priority?: string;

    @IsOptional()
    @IsString()
    dateFrom?: string;

    @IsOptional()
    @IsString()
    dateTo?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

export class RejectPaymentDto {
    @IsString()
    reason: string;
}

export class ApprovePaymentDto {
    @IsOptional()
    @IsString()
    notes?: string;
}
