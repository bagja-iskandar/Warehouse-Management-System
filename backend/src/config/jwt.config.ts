import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET || 'wms_default_access_secret_for_dev_mode_only_2026',
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || 'wms_default_refresh_secret_for_dev_mode_only_2026',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));
