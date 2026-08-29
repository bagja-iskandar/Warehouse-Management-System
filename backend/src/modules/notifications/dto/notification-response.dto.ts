import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationCategory, RelatedEntityType, UserRole } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty({ description: 'ID unik notifikasi', example: 'notif-uuid' })
  id: string;

  @ApiProperty({ description: 'ID User penerima notifikasi', example: 'usr-cust-1' })
  recipientUserId: string;

  @ApiProperty({
    enum: UserRole,
    description: 'Role penerima notifikasi',
    example: UserRole.CUSTOMER,
  })
  recipientRole: UserRole;

  @ApiProperty({ description: 'Judul notifikasi', example: 'Barang Berhasil Didaftarkan' })
  title: string;

  @ApiProperty({
    description: 'Pesan detail notifikasi',
    example: 'Barang Salmon Fillet telah tercatat...',
  })
  message: string;

  @ApiProperty({
    enum: NotificationCategory,
    description: 'Kategori notifikasi',
    example: NotificationCategory.GOODS_STORED,
  })
  category: NotificationCategory;

  @ApiPropertyOptional({
    description: 'ID entitas terkait (misal goodsId, orderId)',
    example: 'brg-001',
  })
  relatedEntityId?: string | null;

  @ApiPropertyOptional({
    enum: RelatedEntityType,
    description: 'Tipe entitas terkait',
    example: RelatedEntityType.GOODS,
  })
  relatedEntityType?: RelatedEntityType | null;

  @ApiProperty({ description: 'Status telah dibaca', example: false })
  isRead: boolean;

  @ApiPropertyOptional({ description: 'URL aksi tujuan saat diklik', example: '/customer/goods' })
  actionUrl?: string | null;

  @ApiProperty({ description: 'Timestamp pembuatan notifikasi (ISO string)' })
  createdAt: string;
}

export class PaginatedNotificationsResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  items: NotificationResponseDto[];

  @ApiProperty({ description: 'Total item keseluruhan' })
  totalItems: number;

  @ApiProperty({ description: 'Halaman saat ini' })
  page: number;

  @ApiProperty({ description: 'Limit per halaman' })
  limit: number;

  @ApiProperty({ description: 'Total halaman' })
  totalPages: number;
}
