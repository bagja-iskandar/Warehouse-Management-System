import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CustomerDetailDto, UsersService } from './users.service';

@ApiTags('Users & Profiles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('customers')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get All Customers & Tenants Directory (Admin Only)',
    description:
      'Retrieves all Customer accounts with storage rental volume statistics and invoice payment statuses.',
  })
  @ApiResponse({
    status: 200,
    description: 'Customers directory retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only Admins are authorized to access customer directory',
  })
  async findCustomers(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: CustomerDetailDto[] }> {
    const data = await this.usersService.findCustomers(currentUser);
    return {
      message: 'Customers retrieved successfully',
      data,
    };
  }

  @Patch(':id/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update User Profile',
    description:
      'Modifies user profile fields (name, contact, company, address, avatar). Only account owner or Admin is authorized.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique user ID (e.g. usr-admin-1 or UUID)',
    example: 'usr-admin-1',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Not allowed to modify another user profile',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: UserProfileDto }> {
    const data = await this.usersService.updateProfile(id, dto, currentUser);
    return {
      message: 'User profile updated successfully',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update User / Customer Record (Admin / Self)',
    description:
      'Updates comprehensive user fields (name, email, phone, company, address, and account status). Status changes require Admin role.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique user ID',
    example: 'd3037ec9-c19c-455a-9e0e-9e57309d4b5b',
  })
  @ApiResponse({
    status: 200,
    description: 'User record updated successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or email already registered',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: UserProfileDto }> {
    const data = await this.usersService.updateUser(id, dto, currentUser);
    return {
      message: 'User record updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Permanently Delete User Account (Admin Only)',
    description:
      'Deletes user account with cascading dependency clean-up (goods, invoices, mutations, orders) in an atomic transaction.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique ID of user to delete',
    example: 'd3037ec9-c19c-455a-9e0e-9e57309d4b5b',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete the active Admin account currently in use',
  })
  @ApiResponse({
    status: 403,
    description: 'Only Admins are authorized to delete user accounts',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string; deletedId: string }> {
    return this.usersService.deleteUser(id, currentUser);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get All Users (Admin Only)',
    description: 'Retrieves all registered users with role breakdown (Admin, Customer, Driver).',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [UserProfileDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Only Admins are authorized to view all users',
  })
  async findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: UserProfileDto[] }> {
    const data = await this.usersService.findAll(currentUser);
    return {
      message: 'Users retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get User Detail By ID',
    description:
      'Retrieves full user profile by ID. Users can only view their own profile unless Admin.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique user ID',
    example: 'usr-admin-1',
  })
  @ApiResponse({
    status: 200,
    description: 'User detail retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Not allowed to view another user profile',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: UserProfileDto }> {
    const data = await this.usersService.findById(id, currentUser);
    return {
      message: 'User detail retrieved successfully',
      data,
    };
  }
}
