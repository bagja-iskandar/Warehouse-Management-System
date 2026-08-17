import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { BillingService } from './billing.service';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { InvoiceDetailResponseDto, InvoiceListItemDto } from './dto/invoice-response.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiTags('Billing & Invoices')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('invoices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Daftar Faktur Tagihan Bulanan (Invoices)',
    description:
      'Mengambil daftar faktur tagihan sewa kubikasi gudang dengan paginasi, filter status (UNPAID, PAID, OVERDUE), kalkulasi denda 5%/minggu otomatis, dan isolasi tenant.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar faktur tagihan berhasil diambil',
    type: [InvoiceListItemDto],
  })
  async findAllInvoices(
    @Query() query: InvoiceQueryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const result = await this.billingService.findAllInvoices(query, currentUser);
    return {
      message: 'Daftar faktur tagihan berhasil diambil',
      data: {
        items: result.items,
        page: result.meta.page,
        limit: result.meta.limit,
        totalItems: result.meta.totalItems,
        totalPages: result.meta.totalPages,
      },
    };
  }

  @Get('invoices/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Detail Faktur Tagihan & Rincian Item',
    description:
      'Mengambil rincian lengkap faktur tagihan beserta daftar item kargo yang disewa, tarif per m3, total denda keterlambatan, dan status pembayaran.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unik UUID faktur atau Nomor Faktur (misal: INV-2026-08-001)',
    example: 'inv-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail faktur tagihan berhasil diambil',
    type: InvoiceDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Faktur tagihan tidak ditemukan atau bukan milik akun Anda',
  })
  async findInvoiceById(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: InvoiceDetailResponseDto }> {
    const data = await this.billingService.findInvoiceById(id, currentUser);
    return {
      message: 'Detail faktur tagihan berhasil diambil',
      data,
    };
  }

  @Post('invoices/:id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Menyerahkan Bukti Pembayaran Tagihan Faktur (Payment Submission)',
    description:
      'Mengirimkan bukti transfer (MinIO/S3), metode pembayaran (VA/Transfer/QRIS), dan nominal pembayaran. Status faktur akan berubah menjadi PENDING_VERIFICATION.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unik UUID faktur atau Nomor Faktur',
    example: 'inv-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Bukti pembayaran berhasil diserahkan dan menunggu verifikasi Admin',
    type: InvoiceDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Nominal pembayaran tidak sesuai total kewajiban atau tagihan sudah lunas',
  })
  async payInvoice(
    @Param('id') id: string,
    @Body() dto: PayInvoiceDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: InvoiceDetailResponseDto }> {
    const data = await this.billingService.payInvoice(id, dto, currentUser);
    return {
      message: 'Bukti pembayaran berhasil diserahkan dan menunggu verifikasi Admin',
      data,
    };
  }

  @Patch('invoices/:id/verify')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verifikasi Pembayaran Faktur Tagihan oleh Admin (Admin Only)',
    description:
      'Admin memverifikasi bukti transfer pembayaran. Jika disetujui (VERIFY), status berubah menjadi PAID. Jika ditolak (REJECT), status kembali ke UNPAID/OVERDUE.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unik UUID faktur atau Nomor Faktur',
    example: 'inv-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Verifikasi pembayaran faktur berhasil diproses',
    type: InvoiceDetailResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Hanya Admin yang berhak melakukan verifikasi pembayaran',
  })
  async verifyPayment(
    @Param('id') id: string,
    @Body() dto: VerifyPaymentDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: InvoiceDetailResponseDto }> {
    const data = await this.billingService.verifyPayment(id, dto, currentUser);
    return {
      message: 'Verifikasi pembayaran faktur berhasil diproses',
      data,
    };
  }
}
