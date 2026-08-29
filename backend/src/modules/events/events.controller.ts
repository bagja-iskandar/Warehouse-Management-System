import {
  Controller,
  Headers,
  MessageEvent,
  Query,
  Sse,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { AuthenticatedUser, JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { EventsService } from './events.service';

@ApiTags('Real-Time Events')
@Controller('events')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Server-Sent Events (SSE) Real-Time Synchronization Stream.
   * Authenticates the user via JWT passed as a query parameter or Authorization Bearer header.
   */
  @Sse('stream')
  @ApiOperation({
    summary: 'Subscribe to real-time domain events stream (SSE)',
    description:
      'Provides a real-time reactive event stream for state synchronization across multi-user sessions.',
  })
  @ApiQuery({
    name: 'token',
    required: false,
    description: 'JWT Access Token for EventSource authentication',
  })
  streamEvents(
    @Query('token') queryToken?: string,
    @Headers('authorization') authHeader?: string,
  ): Observable<MessageEvent> {
    let token = queryToken;

    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      throw new UnauthorizedException(
        'Authentication token is required to open the real-time event stream',
      );
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    const user: AuthenticatedUser = {
      id: payload.sub,
      email: payload.email,
      name: typeof payload.name === 'string' ? payload.name : payload.email,
      role: payload.role,
      phone: typeof payload.phone === 'string' ? payload.phone : '',
      companyName: typeof payload.companyName === 'string' ? payload.companyName : null,
      status: (payload.status as any) || 'ACTIVE',
    };

    return this.eventsService.getUserEventStream(user);
  }
}
