import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, OrderType, VehicleType } from '@prisma/client';
import { GoodsListItemDto } from '../../goods/dto/goods-response.dto';

export class OrderCustomerSummaryDto {
  @ApiProperty({ example: 'usr-cust-1' })
  id: string;

  @ApiProperty({ example: 'Siti Rahma' })
  name: string;

  @ApiPropertyOptional({ example: 'CV Fresh Frozen Nusantara' })
  companyName?: string | null;

  @ApiProperty({ example: '081809876543' })
  phone: string;
}

export class OrderDriverSummaryDto {
  @ApiProperty({ example: 'usr-driver-1' })
  id: string;

  @ApiProperty({ example: 'Agus Pratama' })
  name: string;

  @ApiProperty({ example: '081398765432' })
  phone: string;
}

export class OrderVehicleSummaryDto {
  @ApiProperty({ example: 'veh-01' })
  id: string;

  @ApiProperty({ example: 'B 9821 WMS' })
  plateNumber: string;

  @ApiProperty({ example: 'Isuzu Giga Reefer Cold Truck 5T' })
  name: string;

  @ApiProperty({ enum: VehicleType, example: 'REEFER_TRUCK' })
  type: VehicleType;

  @ApiProperty({ example: true })
  hasRefrigeration: boolean;
}

export class OrderItemDto {
  @ApiProperty({ example: 'item-01' })
  id: string;

  @ApiProperty({ example: 'brg-001' })
  goodsId: string;

  @ApiProperty({ example: 'Frozen Beef' })
  name: string;

  @ApiProperty({ example: 'BRG-2026-FOD-123' })
  barcode: string;

  @ApiProperty({ example: 5 })
  quantity: number;

  @ApiProperty({ example: 'Packages' })
  unit: string;

  @ApiProperty({ example: 0.06 })
  volumeM3: number;

  @ApiProperty({ example: 1.5 })
  weightKg: number;

  @ApiProperty({ example: true })
  requiresColdStorage: boolean;
}

export class DeliveryOrderListItemDto {
  @ApiProperty({ example: 'ord-01' })
  id: string;

  @ApiProperty({ example: 'ORD-2026-092' })
  orderNumber: string;

  @ApiProperty({ enum: OrderType, example: 'PICKUP' })
  type: OrderType;

  @ApiProperty({ example: 'usr-cust-1' })
  customerId: string;

  @ApiProperty({ example: 'Siti Rahma (Customer - Fresh Foods)' })
  customerName: string;

  @ApiProperty({ example: '081809876543' })
  customerPhone: string;

  @ApiProperty({ example: ['brg-001'], type: [String] })
  goodsItemIds: string[];

  @ApiProperty({ type: [OrderItemDto] })
  items: OrderItemDto[];

  @ApiProperty({ example: 5, description: 'Total koli/packages dari seluruh item dalam manifest' })
  totalPackages: number;

  @ApiProperty({ example: '30x Norwegian Salmon Fillet Grade A' })
  goodsSummary: string;

  @ApiProperty({ example: 0.96, description: 'Total volume kubikasi kargo dalam m3' })
  totalVolumeM3: number;

  @ApiProperty({ example: 450.0, description: 'Total berat kargo dalam kg' })
  totalWeightKg: number;

  @ApiProperty({ example: true, description: 'Kebutuhan armada berpendingin (Reefer)' })
  requiresReefer: boolean;

  @ApiProperty({ example: 'Kavling Cold Chain Sudirman Kav. 21' })
  originAddress: string;

  @ApiProperty({ example: 'Jakarta Selatan' })
  originCity: string;

  @ApiProperty({ example: 'Kawasan Industri Pulo Gadung Kav. 12-14' })
  destinationAddress: string;

  @ApiProperty({ example: 'Jakarta Timur' })
  destinationCity: string;

  @ApiProperty({ example: '2026-08-01' })
  scheduledDate: string;

  @ApiProperty({ example: '08:00 - 12:00 WIB' })
  scheduledTimeSlot: string;

  @ApiPropertyOptional({ example: 'usr-driver-1' })
  driverId?: string | null;

  @ApiPropertyOptional({ example: 'Agus Pratama (Driver Reefer)' })
  driverName?: string | null;

  @ApiPropertyOptional({ example: '081398765432' })
  driverPhone?: string | null;

  @ApiPropertyOptional({ example: 'veh-01' })
  vehicleId?: string | null;

  @ApiPropertyOptional({ example: 'B 9821 WMS' })
  vehiclePlate?: string | null;

  @ApiPropertyOptional({ enum: VehicleType, example: 'REEFER_TRUCK' })
  vehicleType?: VehicleType | null;

  @ApiProperty({ enum: OrderStatus, example: 'IN_TRANSIT' })
  status: OrderStatus;

  @ApiProperty({ example: 60 })
  estimatedDurationMins: number;

  @ApiProperty({ example: 28.5 })
  distanceKm: number;

  @ApiPropertyOptional({ example: false })
  isDelayed?: boolean;

  @ApiPropertyOptional({ example: null })
  delayReason?: string | null;

  @ApiPropertyOptional({ example: null })
  rescheduledTime?: string | null;

  @ApiPropertyOptional({ example: null })
  proofOfDeliveryUrl?: string | null;

  @ApiPropertyOptional({ example: null })
  recipientName?: string | null;

  @ApiPropertyOptional({ example: null })
  recipientSignature?: string | null;

  @ApiPropertyOptional({ example: null })
  driverRating?: number | null;

  @ApiProperty({ example: '2026-08-01T07:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-08-01T07:30:00.000Z' })
  updatedAt: string;
}

export class DeliveryOrderDetailResponseDto extends DeliveryOrderListItemDto {
  @ApiProperty({ type: OrderCustomerSummaryDto })
  customer: OrderCustomerSummaryDto;

  @ApiPropertyOptional({ type: OrderDriverSummaryDto })
  driver?: OrderDriverSummaryDto | null;

  @ApiPropertyOptional({ type: OrderVehicleSummaryDto })
  vehicle?: OrderVehicleSummaryDto | null;
}
