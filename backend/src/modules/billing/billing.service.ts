import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  InvoiceStatus,
  NotificationCategory,
  PaymentStatus,
  Prisma,
  RelatedEntityType,
  UserRole,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import {
  InvoiceDetailResponseDto,
  InvoiceListItemDto,
  PaymentResponseDto,
} from './dto/invoice-response.dto';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { StorageService } from './services/storage.service';
import { OVERDUE_PENALTY_RATE_PER_WEEK } from '../../common/constants/pricing.constants';
import { calculateOverduePenalty } from '../../common/utils/calculation.util';

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

  // Aturan Bisnis Denda: 5% per minggu keterlambatan setelah tanggal jatuh tempo (SSOT)
  private readonly PENALTY_RATE_PER_WEEK = new Decimal(OVERDUE_PENALTY_RATE_PER_WEEK.toString());

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
          currentStatus === InvoiceStatus.PENDING_PAYMENT
            ? InvoiceStatus.PENDING_PAYMENT
            : InvoiceStatus.UNPAID,
        daysOverdue: 0,
        overdueWeeks: 0,
      };
    }

    // 4. Melewati Due Date (OVERDUE) -> Hitung denda 5% per minggu
    const diffMs = currentTime - dueTime;
    const daysOverdue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const overdueWeeks = Math.max(1, Math.ceil(daysOverdue / 7));

    // Penalty = subtotal * (0.05 * overdueWeeks) deterministic Decimal calculation (SSOT)
    const penaltyFee = calculateOverduePenalty(
      subtotalDec,
      overdueWeeks,
      OVERDUE_PENALTY_RATE_PER_WEEK,
    );
    const totalAmount = subtotalDec.plus(penaltyFee).toDecimalPlaces(2);

    return {
      subtotal: subtotalDec,
      penaltyFee,
      totalAmount,
      effectiveStatus:
        currentStatus === InvoiceStatus.PENDING_PAYMENT
          ? InvoiceStatus.PENDING_PAYMENT
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
          payments: {
            orderBy: { submittedAt: 'desc' },
            include: {
              customer: { select: { id: true, name: true, companyName: true } },
              verifiedByAdmin: { select: { id: true, name: true } },
            },
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
   * Mengambil detail lengkap faktur tagihan beserta rincian item kargo dan riwayat transaksi pembayaran.
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
        payments: {
          orderBy: { submittedAt: 'desc' },
          include: {
            customer: { select: { id: true, name: true, companyName: true } },
            verifiedByAdmin: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID or number '${id}' not found`);
    }

    // Anti-IDOR Enforcement
    if (currentUser.role === UserRole.CUSTOMER && invoice.customerId !== currentUser.id) {
      throw new NotFoundException(`Invoice with ID or number '${id}' not found`);
    }

    return this.mapToInvoiceDetailResponseDto(invoice);
  }

  /**
   * Retrieves pending payments awaiting Admin verification (UNDER_REVIEW).
   */
  async getPendingPayments(currentUser: AuthenticatedUser): Promise<PaymentResponseDto[]> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Administrators can access the payment verification queue');
    }

    const pendingPayments = await this.prisma.payment.findMany({
      where: { status: PaymentStatus.UNDER_REVIEW },
      orderBy: { submittedAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, companyName: true } },
        verifiedByAdmin: { select: { id: true, name: true } },
      },
    });

    return pendingPayments.map((p) => this.mapToPaymentResponseDto(p));
  }

  // ===========================================================================
  // 3. PAYMENT SUBMISSION & ADMIN VERIFICATION (Atomic Transactions)
  // ===========================================================================

  /**
   * Submits proof of payment by Customer.
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
      include: {
        payments: {
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID or number '${id}' not found`);
    }

    // Anti-IDOR Enforcement
    if (currentUser.role === UserRole.CUSTOMER && invoice.customerId !== currentUser.id) {
      throw new NotFoundException(`Invoice with ID or number '${id}' not found`);
    }

    // Invoice Status Validation
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('This invoice is already marked as PAID');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('This invoice has been CANCELLED');
    }

    // Check for active pending payments
    const activePendingPayment = invoice.payments.find(
      (p) => p.status === PaymentStatus.UNDER_REVIEW,
    );

    if (activePendingPayment || invoice.status === InvoiceStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Payment is currently under review by the administrator. Please wait for verification before resubmitting.',
      );
    }

    // 0. Enforce Demo Portfolio Limit (Maximum 10 Payments)
    const MAX_DEMO_PAYMENTS_LIMIT = 10;
    const currentPaymentsCount = await this.prisma.payment.count();
    if (currentPaymentsCount >= MAX_DEMO_PAYMENTS_LIMIT) {
      throw new BadRequestException(
        `Demo limit reached. Maximum ${MAX_DEMO_PAYMENTS_LIMIT} payments are allowed in this demo environment.`,
      );
    }

    // Calculate penalty and current total
    const penaltyCalc = this.calculatePenalty(invoice.subtotal, invoice.dueDate, invoice.status);

    // Validate payment amount using Decimal
    const submittedAmount = new Decimal(dto.amount);
    if (!submittedAmount.equals(penaltyCalc.totalAmount)) {
      throw new BadRequestException(
        `Payment amount (Rp ${submittedAmount.toNumber().toLocaleString('en-US')}) does not match total payable amount (Rp ${penaltyCalc.totalAmount.toNumber().toLocaleString('en-US')})`,
      );
    }

    const now = new Date();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = now.toISOString().slice(0, 7).replace('-', '');
    const paymentNumber = `PAY-${dateStr}-${randomSuffix}`;

    // Execute Payment in Atomic Database Transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Create new Payment record
      await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          amount: penaltyCalc.totalAmount,
          paymentMethod: dto.paymentMethod,
          paymentReference: dto.paymentReference || `TRX-${Date.now().toString().slice(-8)}`,
          proofUrl: dto.paymentProofUrl,
          status: PaymentStatus.UNDER_REVIEW,
          notes: dto.notes,
          submittedAt: now,
        },
      });

      // 2. Update invoice status to PENDING_PAYMENT
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.PENDING_PAYMENT,
          paymentMethod: dto.paymentMethod,
          paymentProofUrl: dto.paymentProofUrl,
          penaltyFee: penaltyCalc.penaltyFee,
          totalAmount: penaltyCalc.totalAmount,
        },
      });

      // 3. Emit notification to Admins
      const adminUsers = await tx.user.findMany({
        where: { role: UserRole.ADMIN },
        select: { id: true },
      });

      for (const admin of adminUsers) {
        await tx.systemNotification.create({
          data: {
            recipientUserId: admin.id,
            recipientRole: UserRole.ADMIN,
            title: 'New Payment Submitted',
            message: `Customer ${currentUser.name} submitted payment of Rp ${penaltyCalc.totalAmount.toNumber().toLocaleString('en-US')} for Invoice #${invoice.invoiceNumber} (${paymentNumber}). Waiting for review.`,
            category: NotificationCategory.BILLING_DUE,
            relatedEntityId: invoice.id,
            relatedEntityType: RelatedEntityType.INVOICE,
            actionUrl: '/admin/billing',
          },
        });
      }

      // Notification confirmation to Customer
      await tx.systemNotification.create({
        data: {
          recipientUserId: currentUser.id,
          recipientRole: UserRole.CUSTOMER,
          title: 'Proof of Payment Submitted',
          message: `Payment proof for Invoice #${invoice.invoiceNumber} (${paymentNumber}) submitted successfully and is under Admin review.`,
          category: NotificationCategory.BILLING_DUE,
          relatedEntityId: invoice.id,
          relatedEntityType: RelatedEntityType.INVOICE,
          actionUrl: '/customer/billing',
        },
      });
    });

    this.logger.log(
      `Payment proof for invoice '${invoice.invoiceNumber}' (${paymentNumber}) submitted by '${currentUser.name}'. Status: UNDER_REVIEW.`,
    );

    return this.findInvoiceById(invoice.id, currentUser);
  }

  /**
   * Verifies proof of payment by Admin.
   */
  async verifyPayment(
    id: string,
    dto: VerifyPaymentDto,
    currentUser: AuthenticatedUser,
  ): Promise<InvoiceDetailResponseDto> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admins are authorized to verify invoice payments');
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        customer: true,
        payments: {
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID or number '${id}' not found`);
    }

    const latestUnderReviewPayment = invoice.payments.find(
      (p) => p.status === PaymentStatus.UNDER_REVIEW,
    );

    const now = new Date();
    const randomReceiptSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = now.toISOString().slice(0, 7).replace('-', '');
    const receiptNumber = `REC-${dateStr}-${randomReceiptSuffix}`;

    // Eksekusi Verifikasi dalam Transaksi Atomik
    await this.prisma.$transaction(async (tx) => {
      if (dto.action === 'VERIFY') {
        // 1. Update Payment menjadi VERIFIED & set receipt number
        if (latestUnderReviewPayment) {
          await tx.payment.update({
            where: { id: latestUnderReviewPayment.id },
            data: {
              status: PaymentStatus.VERIFIED,
              verifiedAt: now,
              verifiedByAdminId: currentUser.id,
              receiptNumber,
            },
          });
        }

        // 2. Update Invoice menjadi PAID
        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            status: InvoiceStatus.PAID,
            paidDate: now,
            verifiedByAdminId: currentUser.id,
            verifiedAt: now,
          },
        });

        // 3. Kirim notifikasi konfirmasi ke Customer
        await tx.systemNotification.create({
          data: {
            recipientUserId: invoice.customerId,
            recipientRole: UserRole.CUSTOMER,
            title: 'Payment Verified & Settled',
            message: `Your payment for Invoice #${invoice.invoiceNumber} has been verified and settled by admin. Official Receipt #${receiptNumber} is now available.`,
            category: NotificationCategory.PAYMENT_RECEIVED,
            relatedEntityId: invoice.id,
            relatedEntityType: RelatedEntityType.INVOICE,
            actionUrl: '/customer/billing',
          },
        });

        this.logger.log(
          `Pembayaran faktur '${invoice.invoiceNumber}' DISETUJUI oleh Admin '${currentUser.name}'. Status: PAID, Receipt: ${receiptNumber}.`,
        );
      } else {
        // Aksi REJECT: Kembalikan status ke OVERDUE jika lewat jatuh tempo, atau UNPAID jika belum
        const rejectionReason =
          dto.rejectionReason || dto.note || 'Payment proof is invalid or unrecognized.';

        if (latestUnderReviewPayment) {
          await tx.payment.update({
            where: { id: latestUnderReviewPayment.id },
            data: {
              status: PaymentStatus.REJECTED,
              verifiedAt: now,
              verifiedByAdminId: currentUser.id,
              rejectionReason,
            },
          });
        }

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

        // Kirim notifikasi penolakan ke Customer
        await tx.systemNotification.create({
          data: {
            recipientUserId: invoice.customerId,
            recipientRole: UserRole.CUSTOMER,
            title: 'Payment Verification Rejected',
            message: `Your payment for Invoice #${invoice.invoiceNumber} was rejected by admin: "${rejectionReason}". Please review and resubmit a valid payment proof.`,
            category: NotificationCategory.BILLING_DUE,
            relatedEntityId: invoice.id,
            relatedEntityType: RelatedEntityType.INVOICE,
            actionUrl: '/customer/billing',
          },
        });

        this.logger.log(
          `Pembayaran faktur '${invoice.invoiceNumber}' DITOLAK oleh Admin '${currentUser.name}'. Reason: ${rejectionReason}. Status: ${revertStatus}.`,
        );
      }
    });

    return this.findInvoiceById(invoice.id, currentUser);
  }

  // ===========================================================================
  // 4. PRIVATE MAPPING HELPERS
  // ===========================================================================

  private mapToPaymentResponseDto(payment: any): PaymentResponseDto {
    return {
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      customerName: payment.customer?.name,
      customerCompany: payment.customer?.companyName || null,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference,
      proofUrl: payment.proofUrl,
      status: payment.status,
      notes: payment.notes,
      rejectionReason: payment.rejectionReason,
      receiptNumber: payment.receiptNumber,
      submittedAt: payment.submittedAt.toISOString(),
      verifiedAt: payment.verifiedAt ? payment.verifiedAt.toISOString() : null,
      verifiedByAdminId: payment.verifiedByAdminId,
      verifiedByAdminName: payment.verifiedByAdmin?.name || null,
    };
  }

  private mapToInvoiceListItemDto(
    invoice: Prisma.InvoiceGetPayload<{
      include: {
        customer: {
          select: { id: true; name: true; email: true; companyName: true; phone: true };
        };
        verifiedByAdmin: {
          select: { id: true; name: true };
        };
        payments: {
          include: {
            customer: { select: { id: true; name: true; companyName: true } };
            verifiedByAdmin: { select: { id: true; name: true } };
          };
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

    const latestPayment = invoice.payments?.[0];
    const latestVerifiedPayment = invoice.payments?.find(
      (p) => p.status === PaymentStatus.VERIFIED,
    );
    const receiptNumber = latestVerifiedPayment?.receiptNumber || null;

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
      latestPaymentStatus: latestPayment ? latestPayment.status : PaymentStatus.NOT_STARTED,
      receiptNumber,
      latestRejectionReason:
        latestPayment?.status === PaymentStatus.REJECTED ? latestPayment.rejectionReason : null,
      paymentMethod: invoice.paymentMethod,
      paymentProofUrl: invoice.paymentProofUrl,
      verifiedByAdminId: invoice.verifiedByAdminId,
      verifiedAt: invoice.verifiedAt ? invoice.verifiedAt.toISOString() : null,
      daysOverdue: penaltyCalc.daysOverdue,
      overdueWeeks: penaltyCalc.overdueWeeks,
      payments: invoice.payments
        ? invoice.payments.map((p) => this.mapToPaymentResponseDto(p))
        : [],
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
        payments: {
          include: {
            customer: { select: { id: true; name: true; companyName: true } };
            verifiedByAdmin: { select: { id: true; name: true } };
          };
        };
      };
    }>,
  ): InvoiceDetailResponseDto {
    const base = this.mapToInvoiceListItemDto(invoice);
    const latestPayment = invoice.payments?.[0];

    return {
      ...base,
      customer: {
        id: invoice.customer.id,
        name: invoice.customer.name,
        companyName: invoice.customer.companyName,
        email: invoice.customer.email,
        phone: invoice.customer.phone,
      },
      verifiedByAdminName: invoice.verifiedByAdmin?.name || null,
      items: invoice.items.map((item) => ({
        id: item.id,
        goodsId: item.goodsId,
        description: item.description,
        goodsName: item.goodsName || item.goods?.name || null,
        volumeM3: item.volumeM3 ? Number(item.volumeM3) : 0,
        ratePerM3: Number(item.ratePerM3),
        subtotal: Number(item.subtotal),
      })),
      latestPayment: latestPayment ? this.mapToPaymentResponseDto(latestPayment) : null,
    };
  }
}
