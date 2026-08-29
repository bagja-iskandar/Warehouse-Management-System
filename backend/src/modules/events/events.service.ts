import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as crypto from 'crypto';
import { Observable, Subject, filter, map, merge, interval } from 'rxjs';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { DomainEvent, DomainEventType } from './events.types';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly eventBus$ = new Subject<DomainEvent>();

  /**
   * Publish a strongly-typed domain event to the internal reactive event bus.
   * This MUST be called only AFTER the database transaction has committed.
   */
  publish<T = any>(event: {
    type: DomainEventType;
    payload: T;
    targetCustomerId?: string;
    targetWarehouseId?: string;
    targetDriverId?: string;
    targetOrderId?: string;
    targetInvoiceId?: string;
    targetPaymentId?: string;
    targetRoles?: string[];
  }): void {
    const fullEvent: DomainEvent<T> = {
      id: `evt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      type: event.type,
      payload: event.payload,
      timestamp: new Date().toISOString(),
      targetCustomerId: event.targetCustomerId,
      targetWarehouseId: event.targetWarehouseId,
      targetDriverId: event.targetDriverId,
      targetOrderId: event.targetOrderId,
      targetInvoiceId: event.targetInvoiceId,
      targetPaymentId: event.targetPaymentId,
      targetRoles: event.targetRoles,
    };

    this.logger.log(
      `📢 [EVENT PUBLISHED] ${fullEvent.type} (ID: ${fullEvent.id}) - Target Customer: ${fullEvent.targetCustomerId || 'ALL'}, Invoice: ${fullEvent.targetInvoiceId || 'N/A'}`,
    );

    this.eventBus$.next(fullEvent);
  }

  /**
   * Generates a secured, authorized Server-Sent Event stream for a specific connected user.
   */
  getUserEventStream(user: AuthenticatedUser): Observable<MessageEvent> {
    this.logger.debug(
      `⚡ [SSE STREAM OPENED] User connected: ${user.name} (${user.email}) [${user.role}] (ID: ${user.id})`,
    );

    // 1. Filter events based on User Role & Tenant Isolation Boundaries
    const userEvents$ = this.eventBus$.pipe(
      filter((event: DomainEvent) => this.isEventAuthorizedForUser(event, user)),
      map(
        (event: DomainEvent) =>
          ({
            data: event,
          }) as MessageEvent,
      ),
    );

    // 2. Keep-alive heartbeat stream every 25 seconds (prevent proxy timeouts)
    const heartbeat$ = interval(25000).pipe(
      map(
        () =>
          ({
            data: {
              type: 'PING',
              timestamp: new Date().toISOString(),
            },
          }) as MessageEvent,
      ),
    );

    return merge(userEvents$, heartbeat$);
  }

  /**
   * Strict Tenant & Role-Based Authorization Filter
   */
  private isEventAuthorizedForUser(event: DomainEvent, user: AuthenticatedUser): boolean {
    // 1. System Admins can observe all operational events across all warehouses
    if (user.role === UserRole.ADMIN) {
      if (event.targetRoles && !event.targetRoles.includes(UserRole.ADMIN)) {
        return false;
      }
      return true;
    }

    // 2. Customers are strictly isolated to their own customer tenant data
    if (user.role === UserRole.CUSTOMER) {
      // If event is explicitly targeted to another customer, DROP immediately
      if (event.targetCustomerId && event.targetCustomerId !== user.id) {
        return false;
      }
      // If event specifies target roles, user must match
      if (event.targetRoles && !event.targetRoles.includes(UserRole.CUSTOMER)) {
        return false;
      }
      return true;
    }

    // 3. Drivers only receive tasks & events targeted to them or driver broadcast
    if (user.role === UserRole.DRIVER) {
      if (event.targetDriverId && event.targetDriverId !== user.id) {
        return false;
      }
      if (event.targetRoles && !event.targetRoles.includes(UserRole.DRIVER)) {
        return false;
      }
      return true;
    }

    return false;
  }
}
