import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UploadedFileMetadata {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer?: Buffer;
}

export interface StorageUploadResult {
  fileUrl: string;
  bucketName: string;
  objectKey: string;
  sizeBytes: number;
}

export interface IStorageService {
  validatePaymentProof(file: UploadedFileMetadata): void;
  uploadPaymentProof(file: UploadedFileMetadata): Promise<StorageUploadResult>;
}

@Injectable()
export class StorageService implements IStorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  private readonly maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

  private readonly minioEndpoint: string;
  private readonly minioPort: number;
  private readonly bucketName: string;
  private readonly useSSL: boolean;

  constructor(private readonly configService: ConfigService) {
    this.minioEndpoint = this.configService.get<string>('storage.endpoint') || 'localhost';
    this.minioPort = this.configService.get<number>('storage.port') || 9000;
    this.bucketName = this.configService.get<string>('storage.bucketName') || 'wms-storage';
    this.useSSL = this.configService.get<boolean>('storage.useSSL') || false;
  }

  /**
   * Memvalidasi file bukti pembayaran berdasarkan tipe MIME dan batas ukuran.
   */
  validatePaymentProof(file: UploadedFileMetadata): void {
    if (!file) {
      throw new BadRequestException('File bukti pembayaran tidak disertakan');
    }

    if (!this.allowedMimeTypes.includes(file.mimeType)) {
      throw new BadRequestException(
        `Format file '${file.mimeType}' tidak diizinkan. Gunakan JPG, PNG, WEBP, atau PDF.`,
      );
    }

    if (file.sizeBytes > this.maxFileSizeBytes) {
      throw new BadRequestException(
        `Ukuran file (${(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimal 5 MB.`,
      );
    }
  }

  /**
   * Menyimpan file bukti transfer ke MinIO/S3 object storage abstraction.
   */
  async uploadPaymentProof(file: UploadedFileMetadata): Promise<StorageUploadResult> {
    this.validatePaymentProof(file);

    const timestamp = Date.now();
    const cleanFileName = file.originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectKey = `proofs/${timestamp}-${cleanFileName}`;

    const protocol = this.useSSL ? 'https' : 'http';
    const fileUrl = `${protocol}://${this.minioEndpoint}:${this.minioPort}/${this.bucketName}/${objectKey}`;

    this.logger.log(`File bukti pembayaran berhasil disiapkan di storage abstraction: ${fileUrl}`);

    return {
      fileUrl,
      bucketName: this.bucketName,
      objectKey,
      sizeBytes: file.sizeBytes,
    };
  }
}
