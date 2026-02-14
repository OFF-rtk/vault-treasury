import { IsOptional, IsInt, Min, IsNumber, IsPositive, ValidateIf, IsIn, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AccountFiltersDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number;
}

export class UpdateLimitsDto {
    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    daily?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    perTransaction?: number;

    // At least one must be provided — validated in service
}

export class RequestLimitChangeDto {
    @IsIn(['daily', 'per_transaction'])
    limitType: 'daily' | 'per_transaction';

    @IsNumber()
    @IsPositive()
    @Type(() => Number)
    requestedAmount: number;
}

export class RejectLimitRequestDto {
    @IsOptional()
    @IsString()
    reason?: string;
}
