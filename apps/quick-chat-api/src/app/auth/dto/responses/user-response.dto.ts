import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;
  @ApiProperty({ example: 'uuid-user-id' })
  id!: string;

  @ApiProperty({ example: 'Munawar Jamil' })
  fullName!: string;

  @ApiProperty({ example: 'munawar@gmail.com' })
  email!: string;

  @ApiProperty({ example: null, nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ example: false })
  emailVerified!: boolean;
}
