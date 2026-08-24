import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import {
  NotificationResponseDto,
  PaginatedNotificationsResponseDto,
} from './dto/notification-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Mengambil daftar notifikasi pengguna yang sedang login',
    description:
      'Mengambil riwayat notifikasi dengan paginasi, filter isRead, category, terisolasi ketat sesuai pengguna yang terautentikasi.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar notifikasi berhasil diambil',
    type: PaginatedNotificationsResponseDto,
  })
  async findAll(
    @Query() query: NotificationQueryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const result = await this.notificationsService.findAll(query, currentUser);
    return {
      message: 'Daftar notifikasi berhasil diambil',
      data: result,
    };
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Mengambil jumlah notifikasi yang belum dibaca (unread count)',
    description: 'Digunakan oleh icon lonceng notifikasi pada topbar seluruh portal.',
  })
  @ApiResponse({
    status: 200,
    description: 'Jumlah notifikasi belum dibaca berhasil diambil',
  })
  async getUnreadCount(@CurrentUser() currentUser: AuthenticatedUser) {
    const result = await this.notificationsService.getUnreadCount(currentUser);
    return {
      message: 'Jumlah notifikasi unread berhasil diambil',
      data: result,
    };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Menandai seluruh notifikasi pengguna sebagai telah dibaca (Mark All as Read)',
  })
  @ApiResponse({
    status: 200,
    description: 'Seluruh notifikasi berhasil ditandai telah dibaca',
  })
  async markAllAsRead(@CurrentUser() currentUser: AuthenticatedUser) {
    const result = await this.notificationsService.markAllAsRead(currentUser);
    return {
      message: 'Seluruh notifikasi berhasil ditandai telah dibaca',
      data: result,
    };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Menandai satu notifikasi tertentu sebagai telah dibaca',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unik notifikasi',
    example: 'd3b07384-d113-4a25-9b76-a11be078b668',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifikasi berhasil ditandai telah dibaca',
    type: NotificationResponseDto,
  })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const result = await this.notificationsService.markAsRead(id, currentUser);
    return {
      message: 'Notifikasi berhasil ditandai telah dibaca',
      data: result,
    };
  }
}
