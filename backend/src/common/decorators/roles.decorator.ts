import { SetMetadata } from '@nestjs/common';
import { APP_CONSTANTS } from '../constants/app.constants';

export type UserRoleType = 'ADMIN' | 'CUSTOMER' | 'DRIVER';

export const Roles = (...roles: UserRoleType[]) => SetMetadata(APP_CONSTANTS.ROLES_KEY, roles);
