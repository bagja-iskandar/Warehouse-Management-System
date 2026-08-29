import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { AnalyticsService } from './analytics.service';
import {
  AdminOverviewDto,
  CustomerSummaryDto,
  DriverSummaryDto,
  OperationalCountsDto,
} from './dto/analytics.dto';

@ApiTags('Analytics & Operational KPIs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('operational-counts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Hitungan Operasional Realtime (Navbar, Sidebar & Badges)',
    description:
      'Mengambil jumlah antrean aktif pengiriman logistik, tugas driver, alert tagihan invoice, dan notifikasi yang belum dibaca dari PostgreSQL.',
  })
  @ApiResponse({
    status: 200,
    description: 'Hitungan operasional berhasil diambil',
    type: OperationalCountsDto,
  })
  async getOperationalCounts(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: OperationalCountsDto }> {
    const data = await this.analyticsService.getOperationalCounts(currentUser);
    return {
      message: 'Hitungan operasional berhasil diambil',
      data,
    };
  }

  @Get('admin-overview')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Seluruh Agregasi & KPI Operasional Sistem (Admin Dashboard)',
    description:
      'Mengambil perhitungan real-time kapasitas gudang m3, utilisasi slot rak per zona, inventaris SKU barang, metrik pengiriman logistik, pendapatan & denda keterlambatan sewa, serta statistik IoT sensor.',
  })
  @ApiResponse({
    status: 200,
    description: 'Data analitik admin berhasil diagregasi',
    type: AdminOverviewDto,
  })
  async getAdminOverview(
    @Query('warehouseId') warehouseId?: string,
  ): Promise<{ message: string; data: AdminOverviewDto }> {
    const data = await this.analyticsService.getAdminOverview(warehouseId);
    return {
      message: 'Data analitik operasional berhasil diambil',
      data,
    };
  }

  @Get('customer-summary')
  @Roles('CUSTOMER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Ringkasan Analitik Tenant Pelanggan (Customer Dashboard)',
    description:
      'Mengambil metrik volume ruang sewa m3 terpakai vs sisa, kuantitas barang tersimpan, telemetri suhu slot dingin, status faktur tagihan berjalan, dan pesanan pengiriman aktif.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ringkasan tenant pelanggan berhasil diambil',
    type: CustomerSummaryDto,
  })
  async getCustomerSummary(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('customerId') customerId?: string,
  ): Promise<{ message: string; data: CustomerSummaryDto }> {
    // Jika customer memanggil, gunakan ID mereka sendiri; jika admin, dapat menyertakan customerId
    const targetCustomerId =
      currentUser.role === 'ADMIN' && customerId ? customerId : currentUser.id;

    const data = await this.analyticsService.getCustomerSummary(targetCustomerId);
    return {
      message: 'Ringkasan data pelanggan berhasil diambil',
      data,
    };
  }

  @Get('driver-summary')
  @Roles('DRIVER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Ringkasan Tugas & Armada Driver (Driver Dashboard)',
    description:
      'Mengambil data armada kendaraan yang sedang dikemudikan, rute tugas Delivery Order aktif, performa pengiriman, dan riwayat perjalanan.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ringkasan tugas driver berhasil diambil',
    type: DriverSummaryDto,
  })
  async getDriverSummary(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('driverId') driverId?: string,
  ): Promise<{ message: string; data: DriverSummaryDto }> {
    const targetDriverId = currentUser.role === 'ADMIN' && driverId ? driverId : currentUser.id;

    const data = await this.analyticsService.getDriverSummary(targetDriverId);
    return {
      message: 'Ringkasan tugas driver berhasil diambil',
      data,
    };
  }
}
