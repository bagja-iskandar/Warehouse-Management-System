import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignDriverDto {
  @ApiProperty({
    example: 'veh-01',
    description: 'Unique ID of the vehicle to assign',
  })
  @IsString()
  @IsNotEmpty({ message: 'Vehicle ID is required' })
  vehicleId: string;

  @ApiProperty({
    example: 'usr-driver-1',
    description: 'ID of the driver assigned to operate the vehicle',
  })
  @IsString()
  @IsNotEmpty({ message: 'Driver ID is required' })
  driverId: string;
}
