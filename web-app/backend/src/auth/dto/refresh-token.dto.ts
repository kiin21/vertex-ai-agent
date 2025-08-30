import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token to generate new access token',
  })
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString()
  refresh_token: string;
}
