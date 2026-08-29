import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { ChangeRentalWarehouseDto } from './dto/change-rental-warehouse.dto';
import { RentWarehouseSpaceDto } from './dto/rent-warehouse.dto';
import { WarehouseQueryDto } from './dto/warehouse-query.dto';
import {
  StorageSlotResponseDto,
  WarehouseDetailResponseDto,
  WarehouseListItemDto,
} from './dto/warehouse-response.dto';
import { RentalBookingResult, WarehouseService } from './warehouse.service';

@ApiTags('Warehouses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Warehouse Facility Directory',
    description:
      'Retrieves all active warehouse facilities with capacity summary, zones, and rack utilization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Warehouse directory retrieved successfully',
    type: [WarehouseListItemDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or missing token',
  })
  async findAll(
    @Query() query: WarehouseQueryDto,
  ): Promise<{ message: string; data: WarehouseListItemDto[] }> {
    const data = await this.warehouseService.findAll(query);
    return {
      message: 'Warehouse facilities retrieved successfully',
      data,
    };
  }

  @Get('customer/active')
  @Roles('CUSTOMER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Active Customer Warehouse Facilities',
    description:
      'Retrieves warehouses associated with active rentals or stored goods for the logged-in customer.',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer active warehouses retrieved successfully',
    type: [WarehouseListItemDto],
  })
  async getCustomerWarehouses(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: WarehouseListItemDto[] }> {
    const data = await this.warehouseService.getCustomerWarehouses(currentUser);
    return {
      message: 'Customer warehouse facilities retrieved successfully',
      data,
    };
  }

  @Post('rent')
  @Roles('CUSTOMER', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Warehouse Space Rental Booking (Self-Service Rental Booking)',
    description:
      'Records warehouse space rental booking (Cold Storage / Standard), issues real invoice in PostgreSQL, and creates notifications.',
  })
  @ApiResponse({
    status: 201,
    description: 'Warehouse space rental booked successfully and invoice issued',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid rental booking payload',
  })
  @ApiResponse({
    status: 404,
    description: 'Warehouse facility not found',
  })
  async rentSpace(
    @Body() dto: RentWarehouseSpaceDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: RentalBookingResult }> {
    const data = await this.warehouseService.rentSpace(dto, currentUser);
    return {
      message: 'Warehouse space rental request processed successfully and invoice issued',
      data,
    };
  }

  @Post('change-rental-warehouse')
  @Roles('CUSTOMER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pre-Inbound Warehouse Rental Transfer (Change Rental Facility)',
    description:
      'Transfers rented warehouse allocation and DRAFT/PENDING_PICKUP inventory to another facility BEFORE physical receiving.',
  })
  @ApiResponse({
    status: 200,
    description: 'Warehouse rental facility transferred successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Inventory has already entered warehouse operations or invalid request',
  })
  @ApiResponse({
    status: 404,
    description: 'Source or destination warehouse facility not found',
  })
  async changeRentalWarehouse(
    @Body() dto: ChangeRentalWarehouseDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const data = await this.warehouseService.changeRentalWarehouse(dto, currentUser);
    return {
      message: data.message,
      data,
    };
  }

  @Get('slots/:slotId/inventory')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Detailed Rack Slot Inventory & Tenant Contents',
    description:
      'Retrieves live multi-tenant goods currently stored in a rack slot with dual volume & weight capacities and sensor telemetry.',
  })
  @ApiResponse({
    status: 200,
    description: 'Slot inventory retrieved successfully',
    type: StorageSlotResponseDto,
  })
  async getSlotInventoryDirect(
    @Param('slotId') slotId: string,
  ): Promise<{ message: string; data: StorageSlotResponseDto }> {
    const data = await this.warehouseService.getSlotInventory(slotId);
    return {
      message: 'Rack slot inventory retrieved successfully',
      data,
    };
  }

  @Get(':warehouseId/slots/:slotId/inventory')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Warehouse Specific Rack Slot Inventory & Tenant Contents',
    description:
      'Retrieves live multi-tenant goods currently stored in a rack slot within a warehouse facility.',
  })
  @ApiResponse({
    status: 200,
    description: 'Warehouse slot inventory retrieved successfully',
    type: StorageSlotResponseDto,
  })
  async getSlotInventory(
    @Param('warehouseId') warehouseId: string,
    @Param('slotId') slotId: string,
  ): Promise<{ message: string; data: StorageSlotResponseDto }> {
    const data = await this.warehouseService.getSlotInventory(slotId, warehouseId);
    return {
      message: 'Rack slot inventory retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Warehouse Facility Detail & 3D Slot Grid',
    description:
      'Retrieves comprehensive warehouse facility info including storage zones and 3D rack slots.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique warehouse ID (e.g. wh-jkt-central) or Code (e.g. WH-CKG-01)',
    example: 'wh-jkt-central',
  })
  @ApiResponse({
    status: 200,
    description: 'Warehouse facility detail retrieved successfully',
    type: WarehouseDetailResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Warehouse facility not found',
  })
  async findById(
    @Param('id') id: string,
  ): Promise<{ message: string; data: WarehouseDetailResponseDto }> {
    const data = await this.warehouseService.findById(id);
    return {
      message: 'Warehouse facility detail retrieved successfully',
      data,
    };
  }
}
