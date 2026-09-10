import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://velozity_user:velozity_secure_password@localhost:5432/velozity_dashboard?schema=public',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'velozity_dev_access_secret_2026_x89',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'velozity_dev_refresh_secret_2026_z12',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
