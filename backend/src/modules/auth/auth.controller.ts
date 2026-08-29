import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import {
  LoginResponseDto,
  LogoutResponseDto,
  RefreshTokenResponseDto,
  UserProfileDto,
} from './dto/auth-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-reset.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { RequestPasswordResetDto } from './dto/request-reset.dto';
import { AuthenticatedUser } from './interfaces/jwt-payload.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User Authentication & Token Issuance (Login)',
    description:
      'Verifies email credentials and password, then issues JWT Access Token and Refresh Token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or suspended account',
  })
  async login(@Body() loginDto: LoginDto): Promise<{ message: string; data: LoginResponseDto }> {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Login successful',
      data: result,
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register New Customer Account (Customer Onboarding)',
    description:
      'Registers a new corporate customer profile, hashes password, and issues JWT Access Token and Refresh Token.',
  })
  @ApiResponse({
    status: 201,
    description: 'Registration successful and tokens issued',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or incomplete data',
  })
  @ApiResponse({
    status: 409,
    description: 'Email is already registered in the system',
  })
  async register(
    @Body() registerDto: RegisterCustomerDto,
  ): Promise<{ message: string; data: LoginResponseDto }> {
    const result = await this.authService.registerCustomer(registerDto);
    return {
      message: 'Customer registration successful',
      data: result,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renew Access Token (Token Rotation)',
    description: 'Renews an expired Access Token using a valid Refresh Token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token renewal successful',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalid or revoked',
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ message: string; data: RefreshTokenResponseDto }> {
    const result = await this.authService.refreshTokens(refreshTokenDto);
    return {
      message: 'Token renewal successful',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Session Termination & Revoke Refresh Token (Logout)',
    description: 'Revokes user refresh token and terminates active session from device.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful and token revoked',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or missing token',
  })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() logoutDto: LogoutDto,
  ): Promise<{ message: string; data: LogoutResponseDto }> {
    const result = await this.authService.logout(userId, logoutDto.refreshToken);
    return {
      message: result.message,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Authenticated User Profile (Session Check)',
    description: 'Returns the full profile of the currently logged-in user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or missing token',
  })
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string; data: UserProfileDto }> {
    const profile = await this.authService.getProfile(user.id);
    return {
      message: 'User profile retrieved successfully',
      data: profile,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Change Authenticated User Password',
    description:
      'Verifies current password and updates with new password. Revokes active refresh tokens for session security.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'New password same as old password or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Current password invalid or unauthorized',
  })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string; data: { success: boolean; message: string } }> {
    const result = await this.authService.changePassword(userId, changePasswordDto);
    return {
      message: result.message,
      data: result,
    };
  }

  @Public()
  @Post('request-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request Password Reset Token (Forgot Password - Step 1)',
    description:
      'Generates a cryptographically-secure one-time reset token (1-hour TTL) for the registered email. ' +
      'Always returns a generic success response to prevent email enumeration attacks. ' +
      'NOTE: In production, the token must be delivered via email/SMS. ' +
      'In development mode, the token is returned in the response body for integration testing.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reset token generated (or email not found - same response for security)',
  })
  async requestReset(@Body() dto: RequestPasswordResetDto): Promise<{
    message: string;
    data: { success: boolean; message: string; resetToken?: string };
  }> {
    const result = await this.authService.requestPasswordReset(dto.email);
    return {
      message: result.message,
      data: result,
    };
  }

  @Public()
  @Post('confirm-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm Password Reset with Token (Forgot Password - Step 2)',
    description:
      'Validates the one-time reset token, updates the user password, marks the token as used, ' +
      'and revokes all active refresh tokens (sessions) for the account.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Token is invalid, expired, or already used',
  })
  @ApiResponse({
    status: 401,
    description: 'User account is suspended',
  })
  async confirmReset(
    @Body() dto: ConfirmPasswordResetDto,
  ): Promise<{ message: string; data: { success: boolean; message: string } }> {
    const result = await this.authService.confirmPasswordReset(dto.token, dto.newPassword);
    return {
      message: result.message,
      data: result,
    };
  }
}
