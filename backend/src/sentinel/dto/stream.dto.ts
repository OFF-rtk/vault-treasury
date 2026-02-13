import { IsString, IsEnum, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// ── Keyboard Events ───────────────────────────────────────────────

export enum KeyEventType {
    DOWN = 'DOWN',
    UP = 'UP',
}

export class KeyboardEventDto {
    @IsString()
    key: string;

    @IsEnum(KeyEventType)
    event_type: KeyEventType;

    @IsNumber()
    timestamp: number;
}

export class StreamKeyboardDto {
    @IsNumber()
    batch_id: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => KeyboardEventDto)
    events: KeyboardEventDto[];
}

// ── Mouse Events ──────────────────────────────────────────────────

export enum MouseEventType {
    MOVE = 'MOVE',
    CLICK = 'CLICK',
}

export class MouseEventDto {
    @IsNumber()
    x: number;

    @IsNumber()
    y: number;

    @IsEnum(MouseEventType)
    event_type: MouseEventType;

    @IsNumber()
    timestamp: number;
}

export class StreamMouseDto {
    @IsNumber()
    batch_id: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MouseEventDto)
    events: MouseEventDto[];
}
