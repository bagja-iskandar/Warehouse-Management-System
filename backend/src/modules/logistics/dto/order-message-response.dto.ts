import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageDeliveryChannel, MessageDeliveryStatus, OrderMessageType } from '@prisma/client';

export class OrderMessageResponseDto {
  @ApiProperty({
    description: 'Unique message identifier UUID',
    example: 'msg-uuid-001',
  })
  id: string;

  @ApiProperty({
    description: 'Associated Delivery Order UUID',
    example: 'ord-uuid-001',
  })
  orderId: string;

  @ApiProperty({
    description: 'Target Customer User ID',
    example: 'usr-customer-01',
  })
  customerId: string;

  @ApiPropertyOptional({
    description: 'Sender User ID (Admin/Dispatcher)',
    example: 'usr-admin-01',
  })
  senderId: string | null;

  @ApiProperty({
    description: 'Sender display name',
    example: 'Admin Dispatcher WMS',
  })
  senderName: string;

  @ApiProperty({
    description: 'Sender role (e.g. ADMIN, DISPATCHER, SYSTEM)',
    example: 'ADMIN',
  })
  senderRole: string;

  @ApiProperty({
    description: 'Message category / type',
    enum: OrderMessageType,
    example: OrderMessageType.REEFER_UNAVAILABLE,
  })
  messageType: OrderMessageType;

  @ApiProperty({
    description: 'Message title',
    example: 'Reefer Vehicle Unavailable',
  })
  title: string;

  @ApiProperty({
    description: 'Detailed message body',
    example:
      'Your delivery order ORD-2026-82EEE requires a temperature-controlled reefer vehicle. Currently, all suitable reefer vehicles are in use.',
  })
  content: string;

  @ApiProperty({
    description: 'Delivery communication channel',
    enum: MessageDeliveryChannel,
    example: MessageDeliveryChannel.IN_APP,
  })
  channel: MessageDeliveryChannel;

  @ApiProperty({
    description: 'Delivery status',
    enum: MessageDeliveryStatus,
    example: MessageDeliveryStatus.SENT,
  })
  status: MessageDeliveryStatus;

  @ApiProperty({
    description: 'Whether the message has been viewed/read by the customer',
    example: false,
  })
  isRead: boolean;

  @ApiPropertyOptional({
    description: 'Timestamp when the message was read',
    example: '2026-08-25T11:30:00.000Z',
  })
  readAt: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-08-25T11:00:00.000Z',
  })
  createdAt: string;
}
