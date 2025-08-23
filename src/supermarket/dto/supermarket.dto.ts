import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSupermarketDto {
  @IsNotEmpty({ message: 'Supermarket name is required' })
  @IsString({ message: 'Supermarket name must be a string' })
  name: string;

  @IsNotEmpty({ message: 'Supermarket address is required' })
  @IsString({ message: 'Supermarket address must be a string' })
  address: string;

  @IsOptional()
  @IsString({ message: 'Supermarket description must be a string' })
  description?: string;

  @IsNotEmpty({ message: 'Supermarket owner Id is required' })
  @IsString({ message: 'Supermarket owner Id must be a string' })
  ownerId: string;

  @IsOptional()
  @IsString({ message: 'Image must be a string' })
  image?: string;

  @IsOptional()
  @IsString({ message: 'Timezone must be a string' })
  timezone?: string;

  @IsOptional()
  holidayMode?: boolean;

  @IsOptional()
  isOpen?: boolean;

  @IsOptional()
  autoSchedule?: {
    enabled: boolean;
    days: {
      [day: string]: {
        open: string;
        close: string;
        closed: boolean;
      };
    };
  };
}

export class UpdateSupermarketDto {
  @IsOptional()
  @IsString({ message: 'Supermarket name must be a string' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'OpenTime must be a string' })
  openTime?: string;

  @IsOptional()
  @IsString({ message: 'CloseTime must be a string' })
  closeTime?: string;

  @IsOptional()
  @IsString({ message: 'Supermarket address must be a string' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Supermarket description must be a string' })
  description?: string;

  // @IsOptional()
  // @IsEnum(['open', 'closed'], {
  //   message: 'Status must be either "open" or "closed"',
  // })
  // status?: string;

  @IsOptional()
  @IsString({ message: 'Supermarket owner Id must be a string' })
  ownerId?: string;

  @IsOptional()
  @IsString({ message: 'Image must be a string' })
  image?: string;

  @IsOptional()
  @IsString({ message: 'Timezone must be a string' })
  timezone?: string;

  @IsOptional()
  holidayMode?: boolean;

  @IsOptional()
  dropshippingMode?: boolean;

  @IsOptional()
  autoSchedule?: {
    enabled: boolean;
    days: {
      [day: string]: {
        open: string;
        close: string;
        closed: boolean;
      };
    };
  };
}
