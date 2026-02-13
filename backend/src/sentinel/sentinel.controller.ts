import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
    Headers,
    HttpCode,
    HttpStatus,
    HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SentinelService } from './sentinel.service';
import { StreamKeyboardDto, StreamMouseDto } from './dto/stream.dto';

@Controller('sentinel')
@UseGuards(JwtAuthGuard)
export class SentinelController {
    constructor(private readonly sentinelService: SentinelService) { }

    @Post('stream/keyboard')
    @HttpCode(HttpStatus.NO_CONTENT)
    async streamKeyboard(
        @Body() body: StreamKeyboardDto,
        @Request() req: any,
        @Headers('x-sentinel-session') sessionId: string,
    ) {
        if (!sessionId) {
            throw new HttpException('Missing X-Sentinel-Session header', HttpStatus.BAD_REQUEST);
        }

        // Initialize session in Redis on first contact (captures IP, UA)
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        await this.sentinelService.initSession(sessionId, req.user.userId, clientIp, userAgent);

        try {
            await this.sentinelService.streamKeyboard(
                sessionId,
                req.user.userId,
                body.batch_id,
                body.events,
            );
        } catch (error) {
            if (error.message === 'REPLAY_DETECTED') {
                throw new HttpException('Replay detected: batch_id out of sequence', HttpStatus.CONFLICT);
            }
            throw error;
        }
    }

    @Post('stream/mouse')
    @HttpCode(HttpStatus.NO_CONTENT)
    async streamMouse(
        @Body() body: StreamMouseDto,
        @Request() req: any,
        @Headers('x-sentinel-session') sessionId: string,
    ) {
        if (!sessionId) {
            throw new HttpException('Missing X-Sentinel-Session header', HttpStatus.BAD_REQUEST);
        }

        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        await this.sentinelService.initSession(sessionId, req.user.userId, clientIp, userAgent);

        try {
            await this.sentinelService.streamMouse(
                sessionId,
                req.user.userId,
                body.batch_id,
                body.events,
            );
        } catch (error) {
            if (error.message === 'REPLAY_DETECTED') {
                throw new HttpException('Replay detected: batch_id out of sequence', HttpStatus.CONFLICT);
            }
            throw error;
        }
    }
}
