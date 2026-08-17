import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto';
import { TelemetryQueryDto } from './dto/telemetry-query.dto';
import { TelemetryLogDto, TelemetryMonitoringResponseDto } from './dto/telemetry-response.dto';
import { TelemetryService } from './telemetry.service';

@ApiTags('IoT Telemetry & Monitoring')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post('ingest')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Perekaman Data Sensor IoT Telemetri (Sensor Data Ingestion)',
    description:
      'Menerima data telemetri suhu dan kelembaban dari sensor IoT slot Cold Storage atau armada Reefer Truck. Mendeteksi anomali suhu jika > -18.0 C dan menerbitkan peringatan dini.',
  })
  @ApiResponse({
    status: 201,
    description: 'Data sensor telemetri berhasil dicatat',
    type: TelemetryLogDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parameter slotId atau vehicleId tidak valid',
  })
  async ingest(
    @Body() dto: IngestTelemetryDto,
  ): Promise<{ message: string; data: TelemetryLogDto }> {
    const data = await this.telemetryService.ingest(dto);
    return {
      message: 'Data sensor telemetri berhasil dicatat',
      data,
    };
  }

  @Get('monitoring')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Live Snapshot & Status Monitoring Suhu Cold Chain',
    description:
      'Mengambil ringkasan live status kondisi suhu seluruh slot Cold Storage pergudangan dan armada Reefer Truck, deteksi anomali aktif, dan status kondisi (SAFE/WARNING/CRITICAL).',
  })
  @ApiResponse({
    status: 200,
    description: 'Data live monitoring telemetri berhasil diambil',
    type: TelemetryMonitoringResponseDto,
  })
  async getMonitoringSnapshot(): Promise<{
    message: string;
    data: TelemetryMonitoringResponseDto;
  }> {
    const data = await this.telemetryService.getMonitoringSnapshot();
    return {
      message: 'Data live monitoring telemetri berhasil diambil',
      data,
    };
  }

  @Get('logs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Riwayat Log Telemetri Sensor IoT',
    description:
      'Mengambil daftar riwayat pembacaan sensor telemetri dengan paginasi, filter slot/kendaraan, rentang tanggal, dan flag anomali.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar log telemetri berhasil diambil',
    type: [TelemetryLogDto],
  })
  async findAllLogs(@Query() query: TelemetryQueryDto) {
    const result = await this.telemetryService.findAllLogs(query);
    return {
      message: 'Daftar log telemetri berhasil diambil',
      data: {
        items: result.items,
        page: result.meta.page,
        limit: result.meta.limit,
        totalItems: result.meta.totalItems,
        totalPages: result.meta.totalPages,
      },
    };
  }
}
