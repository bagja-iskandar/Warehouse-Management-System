import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignDriverDto {
  @ApiProperty({
    example: 'veh-01',
    description: 'ID unik kendaraan yang akan ditugaskan',
  })
  @IsString()
  @IsNotEmpty({ message: 'ID kendaraan wajib disertakan' })
  vehicleId: string;

  @ApiProperty({
    example: 'usr-driver-1',
    description: 'ID driver yang ditugaskan mengemudikan kendaraan',
  })
  @IsString()
  @IsNotEmpty({ message: 'ID driver wajib disertakan' })
  driverId: string;
}
