import { SetMetadata } from '@nestjs/common';
import { APP_CONSTANTS } from '../constants/app.constants';

export const Public = () => SetMetadata(APP_CONSTANTS.IS_PUBLIC_KEY, true);
