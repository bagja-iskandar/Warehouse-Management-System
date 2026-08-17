import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url:
    process.env.DATABASE_URL ||
    'postgresql://wms_user:wms_secure_pass@localhost:5432/wms_nusantara?schema=public',
}));
