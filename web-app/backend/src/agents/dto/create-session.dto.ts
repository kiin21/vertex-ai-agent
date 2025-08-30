import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    example: 'user123',
    description: 'User ID for the session',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
}
