import { IsOptional, IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateErpConfigDto {
    @IsOptional()
    @IsInt()
    @Min(5, { message: 'Interval must be at least 5 seconds' })
    @Type(() => Number)
    interval_seconds?: number;

    @IsOptional()
    @IsNumber()
    @Min(100, { message: 'Minimum amount must be at least 100' })
    @Type(() => Number)
    min_amount?: number;

    @IsOptional()
    @IsNumber()
    @Min(100, { message: 'Maximum amount must be at least 100' })
    @Type(() => Number)
    max_amount?: number;
}
