import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, Prisma, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { InvoiceDetailResponseDto, InvoiceListItemDto } from './dto/invoice-response.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { StorageService } from './services/storage.service';

export interface PaginatedInvoiceResult {
  items: InvoiceListItemDto[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface PenaltyCalculationResult {
  subtotal: Decimal;
  penaltyFee: Decimal;
  totalAmount: Decimal;
  effectiveStatus: InvoiceStatus;
  daysOverdue: number;
  overdueWeeks: number;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  // Aturan Bisnis Denda: 5% per minggu keterlambatan
  private readonly PENALTY_RATE_PER_WEEK = new Decimal('0.05');

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // ===========================================================================
  // 1. PENALTY CALCULATION ENGINE (Deterministic & Decimal Precision)
  // ===========================================================================

  /**
   * Menghitung denda keterlambatan secara deterministik menggunakan tipe Decimal.
   * Aturan: 5% per minggu keterlambatan setelah tanggal jatuh tempo (due date).
   */
  calculatePenalty(
    subtotal: Decimal,
    dueDate: Date,
    currentStatus: InvoiceStatus,
    paidDate?: Date | null,
    referenceDate?: Date,
  ): PenaltyCalculationResult {
    const subtotalDec = new Decimal(subtotal);

    // 1. Jika invoice sudah LUNAS (PAID)
    if (currentStatus === InvoiceStatus.PAID) {
      return {
        subtotal: subtotalDec,
        penaltyFee: new Decimal(0.0),
        totalAmount: subtotalDec,
        effectiveStatus: InvoiceStatus.PAID,
        daysOverdue: 0,
        overdueWeeks: 0,
      };
    }

    // 2. Jika invoice DIBATALKAN (CANCELLED)
    if (currentStatus === InvoiceStatus.CANCELLED) {
      return {
        subtotal: subtotalDec,
        penaltyFee: new Decimal(0.0),
        totalAmount: subtotalDec,
        effectiveStatus: InvoiceStatus.CANCELLED,
        daysOverdue: 0,
        overdueWeeks: 0,
      };
    }

    const now = referenceDate || new Date();
    const dueTime = dueDate.getTime();
    const currentTime = now.getTime();

    // 3. Belum melewati Due Date atau tepat pada Due Date
    if (currentTime <= dueTime) {
      return {
        subtotal: subtotalDec,
        penaltyFee: new Decimal(0.0),
        totalAmount: subtotalDec,
        effectiveStatus:
          currentStatus === InvoiceStatus.PENDING_VERIFICATION
            ? InvoiceStatus.PENDING_VERIFICATION
            : InvoiceStatus.UNPAID,
        daysOverdue: 0,
        overdueWeeks: 0,
      };
    }

    // 4. Melewati Due Date (OVERDUE) -> Hitung denda 5% per minggu
    const diffMs = currentTime - dueTime;
    const daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const overdueWeeks = Math.max(1, Math.ceil(daysOverdue / 7));

    // Penalty = subtotal * (0.05 * overdueWeeks)
    const penaltyRate = this.PENALTY_RATE_PER_WEEK.mul(overdueWeeks);
    const penaltyFee = subtotalDec.mul(penaltyRate).toDecimalPlaces(2);
    const totalAmount = subtotalDec.plus(penaltyFee).toDecimalPlaces(2);

    return {
      subtotal: subtotalDec,
      penaltyFee,
      totalAmount,
      effectiveStatus:
        currentStatus === InvoiceStatus.PENDING_VERIFICATION
          ? InvoiceStatus.PENDING_VERIFICATION
          : InvoiceStatus.OVERDUE,
      daysOverdue,
      overdueWeeks,
    };
  }

  // ===========================================================================
  // 2. INVOICE QUERIES & RETRIEVAL
  // ===========================================================================

  /**
   * Mengambil daftar faktur tagihan dengan paginasi, filter status, pengurutan, dan isolasi tenant.
   */
  async findAllInvoices(
    query: InvoiceQueryDto,
    currentUser: AuthenticatedUser,
  ): Promise<PaginatedInvoiceResult> {
    const where: Prisma.InvoiceWhereInput = {};

    // 1. Isolasi Data Multi-Tenant (Anti-IDOR)
    if (currentUser.role === UserRole.CUSTOMER) {
      where.customerId = currentUser.id;
    } else if (currentUser.role === UserRole.ADMIN) {
      if (query.customerId) {
        where.customerId = query.customerId;
      }
    }

    // 2. Filter periode bulan penagihan
    if (query.billingMonth) {
      where.billingMonth = { contains: query.billingMonth, mode: 'insensitive' };
    }

    // 3. Filter status
    const now = new Date();
    if (query.status === InvoiceStatus.OVERDUE) {
      where.OR = [
        { status: InvoiceStatus.OVERDUE },
        { status: InvoiceStatus.UNPAID, dueDate: { lt: now } },
      ];
    } else if (query.status === InvoiceStatus.UNPAID) {
      where.status = InvoiceStatus.UNPAID;
      where.dueDate = { gte: now };
    } else if (query.status) {
      where.status = query.status;
    }

    // 4. Pengurutan Data
    const sortBy = query.sortBy || 'dueDate';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy: Prisma.InvoiceOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // 5. Paginasi Database
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;
    const take = limit;

    const [totalItems, invoices] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          customer: {
            select: { id: true, name: true, email: true, companyName: true, phone: true },
          },
          verifiedByAdmin: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;
    const items = invoices.map((inv) => this.mapToInvoiceListItemDto(inv));

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

  /**
   * Mengambil detail lengkap faktur tagihan beserta rincian item kargo dan bukti transfer.
   */
  async findInvoiceById(
    id: string,
    currentUser: AuthenticatedUser,
  ): Promise<InvoiceDetailResponseDto> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            phone: true,
          },
        },
        verifiedByAdmin: {
          select: { id: true, name: true },
        },
        items: {
          include: {
            goods: {
              select: { id: true, name: true, barcode: true },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Faktur tagihan dengan ID atau nomor '${id}' tidak ditemukan`);
    }

    // Penegakan Anti-IDOR
    if (currentUser.role === UserRole.CUSTOMER && invoice.customerId !== currentUser.id) {
      throw new NotFoundException(`Faktur tagihan dengan ID atau nomor '${id}' tidak ditemukan`);
    }

    return this.mapToInvoiceDetailResponseDto(invoice);
  }

  // ===========================================================================
  // 3. PAYMENT SUBMISSION & ADMIN VERIFICATION (Atomic Transactions)
  // ===========================================================================

  /**
   * Penyerahan bukti pembayaran tagihan oleh Customer.
   * Status berubah menjadi PENDING_VERIFICATION (menunggu verifikasi Admin).
   */
  async payInvoice(
    id: string,
    dto: PayInvoiceDto,
    currentUser: AuthenticatedUser,
  ): Promise<InvoiceDetailResponseDto> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Faktur tagihan dengan ID atau nomor '${id}' tidak ditemukan`);
    }

    // Penegakan Anti-IDOR
    if (currentUser.role === UserRole.CUSTOMER && invoice.customerId !== currentUser.id) {
      throw new NotFoundException(`Faktur tagihan dengan ID atau nomor '${id}' tidak ditemukan`);
    }

    // Validasi Status Tagihan
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Faktur tagihan ini sudah berstatus LUNAS (PAID)');
    }

    if (invoice.status === InvoiceStatus.PENDING_VERIFICATION) {
      throw new BadRequestException(
        'Pembayaran tagihan ini sedang dalam antrean verifikasi Admin. Harap menunggu hingga proses verifikasi selesai.',
      );
    }

    // Hitung denda dan total kewajiban tagihan saat ini
    const penaltyCalc = this.calculatePenalty(invoice.subtotal, invoice.dueDate, invoice.status);

    // Validasi Nominal Pembayaran menggunakan Decimal
    const submittedAmount = new Decimal(dto.amount);
    if (!submittedAmount.equals(penaltyCalc.totalAmount)) {
      throw new BadRequestException(
        `Nominal pembayaran (Rp ${submittedAmount.toNumber().toLocaleString('id-ID')}) tidak sesuai dengan total tagihan yang wajib dibayar (Rp ${penaltyCalc.totalAmount.toNumber().toLocaleString('id-ID')})`,
      );
    }

    // Eksekusi Pembaruan Pembayaran dalam Transaksi Atomik
    await this.prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.PENDING_VERIFICATION,
          paymentMethod: dto.paymentMethod,
          paymentProofUrl: dto.paymentProofUrl,
          penaltyFee: penaltyCalc.penaltyFee,
          totalAmount: penaltyCalc.totalAmount,
        },
      });
    });

    this.logger.log(
      `Bukti pembayaran tagihan '${invoice.invoiceNumber}' berhasil diserahkan oleh '${currentUser.name}'. Menunggu verifikasi admin.`,
    );

    return this.findInvoiceById(invoice.id, currentUser);
  }

  /**
   * Verifikasi bukti pembayaran oleh Admin (VERIFY -> PAID / REJECT -> UNPAID/OVERDUE).
   */
  async verifyPayment(
    id: string,
    dto: VerifyPaymentDto,
    currentUser: AuthenticatedUser,
  ): Promise<InvoiceDetailResponseDto> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Hanya Admin yang berhak melakukan verifikasi bukti pembayaran faktur',
      );
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Faktur tagihan dengan ID atau nomor '${id}' tidak ditemukan`);
    }

    const now = new Date();

    // Eksekusi Verifikasi dalam Transaksi Atomik
    await this.prisma.$transaction(async (tx) => {
      if (dto.action === 'VERIFY') {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            status: InvoiceStatus.PAID,
            paidDate: now,
            verifiedByAdminId: currentUser.id,
            verifiedAt: now,
          },
        });
        this.logger.log(
          `Pembayaran faktur '${invoice.invoiceNumber}' DISETUJUI oleh Admin '${currentUser.name}'. Status: PAID.`,
        );
      } else {
        // Aksi REJECT: Kembalikan status ke OVERDUE jika lewat jatuh tempo, atau UNPAID jika belum
        const revertStatus =
          now.getTime() > invoice.dueDate.getTime() ? InvoiceStatus.OVERDUE : InvoiceStatus.UNPAID;

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            status: revertStatus,
            verifiedByAdminId: currentUser.id,
            verifiedAt: now,
          },
        });
        this.logger.log(
          `Pembayaran faktur '${invoice.invoiceNumber}' DITOLAK oleh Admin '${currentUser.name}'. Status: ${revertStatus}.`,
        );
      }
    });

    return this.findInvoiceById(invoice.id, currentUser);
  }

  // ===========================================================================
  // 4. PRIVATE MAPPING HELPERS
  // ===========================================================================

  private mapToInvoiceListItemDto(
    invoice: Prisma.InvoiceGetPayload<{
      include: {
        customer: {
          select: { id: true; name: true; email: true; companyName: true; phone: true };
        };
        verifiedByAdmin: {
          select: { id: true; name: true };
        };
      };
    }>,
  ): InvoiceListItemDto {
    const penaltyCalc = this.calculatePenalty(
      invoice.subtotal,
      invoice.dueDate,
      invoice.status,
      invoice.paidDate,
    );

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customer.name,
      customerCompany: invoice.customer.companyName || null,
      customerEmail: invoice.customer.email,
      billingMonth: invoice.billingMonth,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      paidDate: invoice.paidDate ? invoice.paidDate.toISOString() : null,
      subtotal: penaltyCalc.subtotal.toNumber(),
      penaltyFee:
        invoice.status === InvoiceStatus.PAID
          ? Number(invoice.penaltyFee)
          : penaltyCalc.penaltyFee.toNumber(),
      totalAmount:
        invoice.status === InvoiceStatus.PAID
          ? Number(invoice.totalAmount)
          : penaltyCalc.totalAmount.toNumber(),
      status: penaltyCalc.effectiveStatus,
      paymentMethod: invoice.paymentMethod,
      paymentProofUrl: invoice.paymentProofUrl,
      verifiedByAdminId: invoice.verifiedByAdminId,
      verifiedAt: invoice.verifiedAt ? invoice.verifiedAt.toISOString() : null,
      daysOverdue: penaltyCalc.daysOverdue,
      overdueWeeks: penaltyCalc.overdueWeeks,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    };
  }

  private mapToInvoiceDetailResponseDto(
    invoice: Prisma.InvoiceGetPayload<{
      include: {
        customer: {
          select: { id: true; name: true; email: true; companyName: true; phone: true };
        };
        verifiedByAdmin: {
          select: { id: true; name: true };
        };
        items: {
          include: {
            goods: {
              select: { id: true; name: true; barcode: true };
            };
          };
        };
      };
    }>,
  ): InvoiceDetailResponseDto {
    const base = this.mapToInvoiceListItemDto(invoice);

    const items = invoice.items.map((item) => ({
      id: item.id,
      goodsId: item.goodsId,
      description: item.description,
      goodsName: item.goodsName || item.goods?.name || null,
      volumeM3: Number(item.volumeM3),
      ratePerM3: Number(item.ratePerM3),
      subtotal: Number(item.subtotal),
    }));

    return {
      ...base,
      customer: {
        id: invoice.customer.id,
        name: invoice.customer.name,
        companyName: invoice.customer.companyName || null,
        email: invoice.customer.email,
        phone: invoice.customer.phone,
      },
      verifiedByAdminName: invoice.verifiedByAdmin?.name || null,
      items,
    };
  }
}
