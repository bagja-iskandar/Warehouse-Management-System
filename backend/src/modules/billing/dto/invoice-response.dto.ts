import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

export class InvoiceCustomerSummaryDto {
  @ApiProperty({ example: 'usr-cust-1' })
  id: string;

  @ApiProperty({ example: 'Siti Rahma' })
  name: string;

  @ApiPropertyOptional({ example: 'CV Fresh Frozen Nusantara' })
  companyName?: string | null;

  @ApiProperty({ example: 'customer@freshfoods.id' })
  email: string;

  @ApiProperty({ example: '081809876543' })
  phone: string;
}

export class InvoiceItemDto {
  @ApiProperty({ example: 'inv-item-1' })
  id: string;

  @ApiPropertyOptional({ example: 'brg-001' })
  goodsId?: string | null;

  @ApiProperty({ example: 'Sewa Cold Storage (Slot COLD-A01) - 0.96 m3' })
  description: string;

  @ApiPropertyOptional({ example: 'Norwegian Salmon Fillet Grade A' })
  goodsName?: string | null;

  @ApiProperty({ example: 0.96, description: 'Volume kubikasi sewa dalam m3' })
  volumeM3: number;

  @ApiProperty({ example: 2500000.0, description: 'Tarif sewa per m3 per bulan (IDR)' })
  ratePerM3: number;

  @ApiProperty({ example: 2400000.0, description: 'Subtotal biaya item (IDR)' })
  subtotal: number;
}

export class InvoiceListItemDto {
  @ApiProperty({ example: 'inv-001' })
  id: string;

  @ApiProperty({ example: 'INV-2026-08-001' })
  invoiceNumber: string;

  @ApiProperty({ example: 'usr-cust-1' })
  customerId: string;

  @ApiProperty({ example: 'Siti Rahma (Customer - Fresh Foods)' })
  customerName: string;

  @ApiPropertyOptional({ example: 'CV Fresh Frozen Nusantara' })
  customerCompany?: string | null;

  @ApiProperty({ example: 'customer@freshfoods.id' })
  customerEmail: string;

  @ApiProperty({ example: 'Agustus 2026' })
  billingMonth: string;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  issueDate: string;

  @ApiProperty({ example: '2026-08-10T23:59:59.000Z' })
  dueDate: string;

  @ApiPropertyOptional({ example: null })
  paidDate?: string | null;

  @ApiProperty({
    example: 7440000.0,
    description: 'Subtotal tagihan sewa murni sebelum denda (IDR)',
  })
  subtotal: number;

  @ApiProperty({
    example: 372000.0,
    description: 'Denda keterlambatan pembayaran 5% per minggu (IDR)',
  })
  penaltyFee: number;

  @ApiProperty({ example: 7812000.0, description: 'Total kewajiban tagihan termasuk denda (IDR)' })
  totalAmount: number;

  @ApiProperty({ enum: InvoiceStatus, example: 'OVERDUE' })
  status: InvoiceStatus;

  @ApiPropertyOptional({ enum: PaymentMethod, example: 'VIRTUAL_ACCOUNT' })
  paymentMethod?: PaymentMethod | null;

  @ApiPropertyOptional({ example: null })
  paymentProofUrl?: string | null;

  @ApiPropertyOptional({ example: null })
  verifiedByAdminId?: string | null;

  @ApiPropertyOptional({ example: null })
  verifiedAt?: string | null;

  @ApiPropertyOptional({
    example: 7,
    description: 'Jumlah hari keterlambatan melewati batas due date',
  })
  daysOverdue?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Jumlah minggu keterlambatan untuk dasar pengali denda 5%',
  })
  overdueWeeks?: number;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-08-17T00:00:00.000Z' })
  updatedAt: string;
}

export class InvoiceDetailResponseDto extends InvoiceListItemDto {
  @ApiProperty({ type: InvoiceCustomerSummaryDto })
  customer: InvoiceCustomerSummaryDto;

  @ApiPropertyOptional({ example: 'Budi Santoso (Admin)' })
  verifiedByAdminName?: string | null;

  @ApiProperty({ type: [InvoiceItemDto] })
  items: InvoiceItemDto[];
}
