import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  NotificationCategory,
  Prisma,
  RelatedEntityType,
  StorageZoneType,
  UserRole,
  VehicleType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto';
import { TelemetryQueryDto } from './dto/telemetry-query.dto';
import {
  ColdStorageSlotMonitoringDto,
  ReeferVehicleMonitoringDto,
  TelemetryLogDto,
  TelemetryMonitoringResponseDto,
} from './dto/telemetry-response.dto';

export interface PaginatedTelemetryLogResult {
  items: TelemetryLogDto[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  // Ambang batas aman suhu Cold Storage standard WMS
  public static readonly COLD_STORAGE_THRESHOLD_CELSIUS = -18.0;
  public static readonly WARNING_THRESHOLD_CELSIUS = -15.0;

  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // 1. TELEMETRY DATA INGESTION
  // ===========================================================================

  /**
   * Perekaman data sensor suhu dan kelembaban IoT ke database dalam transaksi atomik.
   * Otomatis mendeteksi anomali suhu jika melebihi batas -18.0 C dan menerbitkan notifikasi alert.
   */
  async ingest(dto: IngestTelemetryDto): Promise<TelemetryLogDto> {
    if (!dto.slotId && !dto.vehicleId) {
      throw new BadRequestException(
        'Harap sertakan minimal salah satu parameter: slotId atau vehicleId untuk perekaman telemetri',
      );
    }

    let isAnomaly = false;
    let slot = null;
    let vehicle = null;

    // 1. Verifikasi Slot Rak (jika disertakan)
    if (dto.slotId) {
      slot = await this.prisma.storageSlot.findUnique({
        where: { id: dto.slotId },
        include: {
          warehouse: true,
          goodsItems: {
            include: { customer: true },
          },
        },
      });

      if (!slot) {
        throw new NotFoundException(`Slot rak gudang dengan ID '${dto.slotId}' tidak ditemukan`);
      }

      // Deteksi anomali jika slot berada di zona Cold Storage dan suhu > -18.0 C
      if (
        slot.zone === StorageZoneType.COLD_STORAGE &&
        dto.temperatureCelsius > TelemetryService.COLD_STORAGE_THRESHOLD_CELSIUS
      ) {
        isAnomaly = true;
      }
    }

    // 2. Verifikasi Kendaraan Armada (jika disertakan)
    if (dto.vehicleId) {
      vehicle = await this.prisma.vehicle.findUnique({
        where: { id: dto.vehicleId },
        include: { driver: true },
      });

      if (!vehicle) {
        throw new NotFoundException(
          `Kendaraan armada dengan ID '${dto.vehicleId}' tidak ditemukan`,
        );
      }

      // Deteksi anomali jika kendaraan adalah Reefer Truck dan suhu > -18.0 C
      if (
        (vehicle.type === VehicleType.REEFER_TRUCK || vehicle.hasRefrigeration) &&
        dto.temperatureCelsius > TelemetryService.COLD_STORAGE_THRESHOLD_CELSIUS
      ) {
        isAnomaly = true;
      }
    }

    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();

    // 3. Eksekusi Perekaman dalam Transaksi Atomik
    const createdLog = await this.prisma.$transaction(async (tx) => {
      // A. Simpan log sensor
      const log = await tx.telemetryLog.create({
        data: {
          slotId: dto.slotId || null,
          vehicleId: dto.vehicleId || null,
          temperatureCelsius: new Decimal(dto.temperatureCelsius),
          humidityPercent:
            dto.humidityPercent !== undefined ? new Decimal(dto.humidityPercent) : null,
          isAnomaly,
          recordedAt,
        },
        include: {
          slot: { include: { warehouse: true } },
          vehicle: true,
        },
      });

      // B. Sinkronisasi suhu terkini pada Slot Gudang & Barang yang tersimpan
      if (dto.slotId) {
        await tx.storageSlot.update({
          where: { id: dto.slotId },
          data: {
            temperatureCelsius: new Decimal(dto.temperatureCelsius),
            humidityPercent:
              dto.humidityPercent !== undefined ? new Decimal(dto.humidityPercent) : undefined,
          },
        });

        await tx.goodsItem.updateMany({
          where: { slotId: dto.slotId },
          data: {
            currentTemp: new Decimal(dto.temperatureCelsius),
          },
        });
      }

      // C. Peringatan Dini (Alert Notification) jika terjadi Anomali Suhu
      if (isAnomaly) {
        // Ambil Admin aktif
        const adminUsers = await tx.user.findMany({
          where: { role: UserRole.ADMIN },
          select: { id: true },
        });

        if (slot) {
          const alertMessage = `ALERT SUHU: Slot Cold Storage ${slot.code} di ${slot.warehouse.name} tercatat ${dto.temperatureCelsius} C (Melebihi batas aman ${TelemetryService.COLD_STORAGE_THRESHOLD_CELSIUS} C)!`;
          this.logger.warn(alertMessage);

          // Notifikasi untuk seluruh Admin
          for (const admin of adminUsers) {
            await tx.systemNotification.create({
              data: {
                recipientUserId: admin.id,
                recipientRole: UserRole.ADMIN,
                title: `Peringatan Anomali Suhu Slot ${slot.code}`,
                message: alertMessage,
                category: NotificationCategory.GOODS_STORED,
                relatedEntityId: slot.warehouseId,
                relatedEntityType: RelatedEntityType.WAREHOUSE,
              },
            });
          }

          // Notifikasi untuk Customer yang memiliki barang di slot tersebut
          for (const goods of slot.goodsItems) {
            await tx.systemNotification.create({
              data: {
                recipientUserId: goods.customerId,
                recipientRole: UserRole.CUSTOMER,
                title: `Peringatan Suhu Penyimpanan: ${goods.name}`,
                message: `Suhu slot penyimpanan ${slot.code} tercatat ${dto.temperatureCelsius} C. Tim operasional WMS sedang melakukan pengecekan unit pendingin.`,
                category: NotificationCategory.GOODS_STORED,
                relatedEntityId: goods.id,
                relatedEntityType: RelatedEntityType.GOODS,
              },
            });
          }
        }

        if (vehicle) {
          const alertMessage = `ALERT SUHU ARMADA: Box pendingin Truk Reefer ${vehicle.plateNumber} tercatat ${dto.temperatureCelsius} C (Melebihi batas aman ${TelemetryService.COLD_STORAGE_THRESHOLD_CELSIUS} C)!`;
          this.logger.warn(alertMessage);

          for (const admin of adminUsers) {
            await tx.systemNotification.create({
              data: {
                recipientUserId: admin.id,
                recipientRole: UserRole.ADMIN,
                title: `Peringatan Suhu Truk Reefer ${vehicle.plateNumber}`,
                message: alertMessage,
                category: NotificationCategory.SCHEDULE_DELAY,
              },
            });
          }

          if (vehicle.currentDriverId) {
            await tx.systemNotification.create({
              data: {
                recipientUserId: vehicle.currentDriverId,
                recipientRole: UserRole.DRIVER,
                title: `Peringatan Suhu Unit Reefer Anda (${vehicle.plateNumber})`,
                message: `Suhu box pendingin Anda tercatat ${dto.temperatureCelsius} C. Harap segera periksa unit pendingin Thermo King / Carrier kargo Anda.`,
                category: NotificationCategory.SCHEDULE_DELAY,
              },
            });
          }
        }
      }

      return log;
    });

    return this.mapToTelemetryLogDto(createdLog);
  }

  // ===========================================================================
  // 2. LIVE MONITORING SNAPSHOT & FEED
  // ===========================================================================

  /**
   * Mengambil snapshot live monitoring suhu & kelembaban untuk seluruh Cold Storage dan armada Reefer.
   */
  async getMonitoringSnapshot(): Promise<TelemetryMonitoringResponseDto> {
    // 1. Ambil seluruh slot Cold Storage
    const coldSlots = await this.prisma.storageSlot.findMany({
      where: { zone: StorageZoneType.COLD_STORAGE },
      include: {
        warehouse: { select: { id: true, code: true, name: true } },
        goodsItems: { select: { id: true, name: true } },
      },
      orderBy: { code: 'asc' },
    });

    // 2. Ambil seluruh armada Reefer Truck
    const reeferVehicles = await this.prisma.vehicle.findMany({
      where: {
        OR: [{ type: VehicleType.REEFER_TRUCK }, { hasRefrigeration: true }],
      },
      include: {
        driver: { select: { id: true, name: true, phone: true } },
        telemetryLogs: {
          take: 1,
          orderBy: { recordedAt: 'desc' },
        },
      },
      orderBy: { plateNumber: 'asc' },
    });

    // 3. Mapping data slot & hitung kondisi
    let safeCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let totalTempSum = 0;
    let tempCount = 0;

    const mappedSlots: ColdStorageSlotMonitoringDto[] = coldSlots.map((slot) => {
      const temp = slot.temperatureCelsius !== null ? Number(slot.temperatureCelsius) : -19.0;
      totalTempSum += temp;
      tempCount++;

      let condition: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
      if (temp > TelemetryService.WARNING_THRESHOLD_CELSIUS) {
        condition = 'CRITICAL';
        criticalCount++;
      } else if (temp > TelemetryService.COLD_STORAGE_THRESHOLD_CELSIUS) {
        condition = 'WARNING';
        warningCount++;
      } else {
        safeCount++;
      }

      return {
        slotId: slot.id,
        slotCode: slot.code,
        warehouseId: slot.warehouseId,
        warehouseName: slot.warehouse.name,
        warehouseCode: slot.warehouse.code,
        currentTempCelsius: temp,
        humidityPercent: slot.humidityPercent ? Number(slot.humidityPercent) : null,
        status: slot.status,
        condition,
        goodsCount: slot.goodsItems.length,
        storedGoodsNames: slot.goodsItems.map((g: { id: string; name: string }) => g.name),
      };
    });

    // 4. Mapping data armada reefer
    const mappedVehicles: ReeferVehicleMonitoringDto[] = reeferVehicles.map((v) => {
      const latestLog = v.telemetryLogs[0];
      const temp = latestLog
        ? Number(latestLog.temperatureCelsius)
        : v.minTempCelsius
          ? Number(v.minTempCelsius)
          : -20.0;
      totalTempSum += temp;
      tempCount++;

      let condition: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
      if (temp > TelemetryService.WARNING_THRESHOLD_CELSIUS) {
        condition = 'CRITICAL';
        criticalCount++;
      } else if (temp > TelemetryService.COLD_STORAGE_THRESHOLD_CELSIUS) {
        condition = 'WARNING';
        warningCount++;
      } else {
        safeCount++;
      }

      return {
        vehicleId: v.id,
        plateNumber: v.plateNumber,
        name: v.name,
        currentDriverName: v.driver?.name || null,
        currentTempCelsius: temp,
        minTempCelsius: v.minTempCelsius ? Number(v.minTempCelsius) : null,
        condition,
        status: v.status,
      };
    });

    const totalMonitoredSensors = mappedSlots.length + mappedVehicles.length;
    const activeAnomaliesCount = warningCount + criticalCount;
    const averageColdTempCelsius =
      tempCount > 0 ? Number((totalTempSum / tempCount).toFixed(1)) : -19.0;

    return {
      summary: {
        totalMonitoredSensors,
        activeAnomaliesCount,
        coldStorageSafeCount: safeCount,
        coldStorageWarningCount: warningCount,
        coldStorageCriticalCount: criticalCount,
        averageColdTempCelsius,
      },
      slots: mappedSlots,
      vehicles: mappedVehicles,
    };
  }

  // ===========================================================================
  // 3. TELEMETRY LOGS HISTORY
  // ===========================================================================

  /**
   * Mengambil riwayat log telemetri dengan paginasi dan filter parameter.
   */
  async findAllLogs(query: TelemetryQueryDto): Promise<PaginatedTelemetryLogResult> {
    const where: Prisma.TelemetryLogWhereInput = {};

    if (query.slotId) where.slotId = query.slotId;
    if (query.vehicleId) where.vehicleId = query.vehicleId;
    if (query.isAnomaly !== undefined) where.isAnomaly = query.isAnomaly;

    if (query.startDate || query.endDate) {
      where.recordedAt = {};
      if (query.startDate) where.recordedAt.gte = new Date(query.startDate);
      if (query.endDate) where.recordedAt.lte = new Date(query.endDate);
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;
    const take = limit;

    const [totalItems, logs] = await Promise.all([
      this.prisma.telemetryLog.count({ where }),
      this.prisma.telemetryLog.findMany({
        where,
        skip,
        take,
        orderBy: { recordedAt: 'desc' },
        include: {
          slot: { include: { warehouse: true } },
          vehicle: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;
    const items = logs.map((log) => this.mapToTelemetryLogDto(log));

    return {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  // ===========================================================================
  // 4. PRIVATE MAPPING HELPERS
  // ===========================================================================

  private mapToTelemetryLogDto(
    log: Prisma.TelemetryLogGetPayload<{
      include: {
        slot: { include: { warehouse: true } };
        vehicle: true;
      };
    }>,
  ): TelemetryLogDto {
    return {
      id: log.id.toString(),
      slotId: log.slotId,
      slotCode: log.slot?.code || null,
      warehouseName: log.slot?.warehouse.name || null,
      vehicleId: log.vehicleId,
      vehiclePlate: log.vehicle?.plateNumber || null,
      temperatureCelsius: Number(log.temperatureCelsius),
      humidityPercent: log.humidityPercent ? Number(log.humidityPercent) : null,
      isAnomaly: log.isAnomaly,
      recordedAt: log.recordedAt.toISOString(),
    };
  }
}
