import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageDeliveryChannel, OrderMessageType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrderMessageDto {
  @ApiProperty({
    description: 'Type / category of communication update for the Delivery Order',
    enum: OrderMessageType,
    example: OrderMessageType.REEFER_UNAVAILABLE,
  })
  @IsEnum(OrderMessageType)
  @IsNotEmpty()
  messageType: OrderMessageType;

  @ApiProperty({
    description: 'Concise title / subject of the communication message',
    example: 'Reefer Vehicle Unavailable',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiProperty({
    description: 'Detailed operational message content sent to the customer',
    example:
      'Your delivery order ORD-2026-82EEE requires a temperature-controlled reefer vehicle. Currently, all suitable reefer vehicles are in use. Your order remains active, and our dispatch team is working to assign the next available vehicle.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Primary delivery channel for the message (defaults to IN_APP)',
    enum: MessageDeliveryChannel,
    default: MessageDeliveryChannel.IN_APP,
  })
  @IsEnum(MessageDeliveryChannel)
  @IsOptional()
  channel?: MessageDeliveryChannel = MessageDeliveryChannel.IN_APP;
}
