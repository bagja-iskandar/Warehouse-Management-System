import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StorageService } from './services/storage.service';

@Module({
  imports: [DatabaseModule, ConfigModule, NotificationsModule],
  controllers: [BillingController],
  providers: [BillingService, StorageService],
  exports: [BillingService, StorageService],
})
export class BillingModule {}
