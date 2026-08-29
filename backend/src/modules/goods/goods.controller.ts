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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '@prisma/client';
import { CreateGoodsDto } from './dto/create-goods.dto';
import { GoodsQueryDto } from './dto/goods-query.dto';
import { GoodsDetailResponseDto, GoodsListItemDto } from './dto/goods-response.dto';
import { TransferGoodsSlotDto } from './dto/transfer-goods-slot.dto';
import { UpdateGoodsStatusDto } from './dto/update-goods-status.dto';
import { GoodsService } from './goods.service';

@ApiTags('Goods & Inventory')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('goods')
export class GoodsController {
  constructor(private readonly goodsService: GoodsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register New Inventory Item (SKU Registration)',
    description:
      'Registers a new goods item with server-side volume calculation (L x W x H / 10^6 x Qty), automated rental fee estimation, and unique QR/Barcode generation.',
  })
  @ApiResponse({
    status: 201,
    description: 'Goods registered successfully',
    type: GoodsDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or incomplete payload',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Account role is not authorized to register goods',
  })
  async create(
    @Body() dto: CreateGoodsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: GoodsDetailResponseDto }> {
    const data = await this.goodsService.create(dto, currentUser);
    return {
      message: 'Goods registered successfully',
      data,
    };
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Goods Storage Status (State Machine Transition)',
    description:
      'Transitions goods lifecycle status (DRAFT -> PENDING_PICKUP -> STORED -> DELIVERED) with rack slot allocation, capacity checks, and audit mutation logs.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique goods UUID or Barcode/SKU',
    example: 'brg-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Goods status updated successfully',
    type: GoodsDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition or insufficient slot capacity',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Account role is not authorized for this status transition',
  })
  @ApiResponse({
    status: 404,
    description: 'Goods or rack slot not found',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateGoodsStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: GoodsDetailResponseDto }> {
    const data = await this.goodsService.updateStatus(id, dto, currentUser);
    return {
      message: 'Goods status updated successfully',
      data,
    };
  }

  @Post(':id/transfer-slot')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transfer Goods Between Storage Rack Slots (Rack Transfer)',
    description:
      'Transfers STORED goods to another compatible rack slot within the same warehouse, validating temperature zone and volume capacity.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique goods UUID or Barcode/SKU',
    example: 'brg-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Goods transferred to destination rack slot successfully',
    type: GoodsDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Transfer validation failed (slot incompatible, insufficient capacity, etc.)',
  })
  @ApiResponse({
    status: 403,
    description: 'Only Admins are authorized to perform rack transfers',
  })
  @ApiResponse({
    status: 404,
    description: 'Goods or target rack slot not found',
  })
  async transferSlot(
    @Param('id') id: string,
    @Body() dto: TransferGoodsSlotDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: GoodsDetailResponseDto }> {
    const data = await this.goodsService.transferSlot(id, dto, currentUser);
    return {
      message: 'Goods transferred to target rack slot successfully',
      data,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Goods Inventory List (SKU Directory)',
    description:
      'Retrieves master inventory list with pagination, search, category filtering, and tenant isolation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Goods directory retrieved successfully',
    type: [GoodsListItemDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or missing token',
  })
  async findAll(@Query() query: GoodsQueryDto, @CurrentUser() currentUser: AuthenticatedUser) {
    const result = await this.goodsService.findAll(query, currentUser);
    return {
      message: 'Goods retrieved successfully',
      data: {
        items: result.items,
        page: result.meta.page,
        limit: result.meta.limit,
        totalItems: result.meta.totalItems,
        totalPages: result.meta.totalPages,
      },
    };
  }

  @Get('mutations')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Goods Mutation History Log (Audit Trail)',
    description:
      'Retrieves mutation audit history for cargo inventory belonging to the authenticated tenant.',
  })
  @ApiResponse({
    status: 200,
    description: 'Goods mutation history retrieved successfully',
  })
  async findMutations(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('customerId') customerId?: string,
  ) {
    const data = await this.goodsService.findMutations(currentUser, customerId);
    return {
      message: 'Goods mutation history retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Goods Detail & Warehouse Mutation History',
    description:
      'Retrieves detailed goods info by ID or Barcode, including dimensions, volume, assigned rack slot, and audit history.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique goods UUID (e.g. brg-001) or Barcode/SKU (e.g. BRG-2026-FROZEN-001)',
    example: 'brg-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Goods detail retrieved successfully',
    type: GoodsDetailResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Goods not found or does not belong to your account',
  })
  async findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: GoodsDetailResponseDto }> {
    const data = await this.goodsService.findById(id, currentUser);
    return {
      message: 'Goods detail retrieved successfully',
      data,
    };
  }
}
