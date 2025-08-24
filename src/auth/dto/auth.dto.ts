import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class SignUpDto {
  @IsNotEmpty({ message: 'First name is required' })
  @IsString({ message: 'First name must be a string' })
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString({ message: 'Last name must be a string' })
  lastName: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please enter a valid email' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsNumber({}, { message: 'Phone number must be a number' })
  phone: number;

  @IsNotEmpty({ message: 'Adress is required' })
  @IsString({ message: 'Adress must be a string' })
  address: string;

  @IsOptional()
  @IsString({ message: 'Estate must be a string' })
  estate?: string;

  @IsNotEmpty({ message: 'Business name is required' })
  @IsString({ message: 'Business name must be a string' })
  businessName?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Business phone number must be a number ' })
  businessPhoneNumber?: number;

  @IsOptional()
  @IsString({ message: 'Business description must be a string' })
  businessDescription?: string;

  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  adminPassKey?: string;

  @IsNotEmpty({ message: 'User type is required' })
  @IsEnum(['admin', 'user', 'vendor', 'rider'], {
    message: 'User type must be admin, user, vencor or rider',
  })
  userType: string;
}

export class LogInDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please enter a valid email' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  password: string;

  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  adminPassKey?: string;

  @IsNotEmpty({ message: 'UserType is required' })
  @IsString({ message: 'Usertype must be a string' })
  userType: string;
}
