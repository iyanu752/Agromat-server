import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ADMIN_PASSKEY } from 'src/common/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../users/userschema';
import mongoose, { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { LogInDto, SignUpDto } from './dto/auth.dto';
import { SuperMarket } from 'src/supermarket/supermarketschema';
import { SuperMarketDocument } from 'src/supermarket/supermarketschema';
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(SuperMarket.name)
    private supermarketModel: Model<SuperMarketDocument>,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<{ user: any }> {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      estate,
      userType,
      businessName,
      businessDescription,
      businessPhoneNumber,
      adminPassKey,
    } = signUpDto;
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    if (userType === 'admin') {
      const envPassKey = ADMIN_PASSKEY;
      if (!adminPassKey || adminPassKey !== envPassKey) {
        throw new UnauthorizedException('Invalid admin passkey');
      }
    }

    try {
      const user = await this.userModel.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        address,
        estate,
        userType,
        businessName,
        businessDescription,
        businessPhoneNumber,
      });
      const userResponse = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        estate: user.estate,
        userType: user.userType,
        businessName: user.businessName,
        businessDescription: user.businessDescription,
        businessPhoneNumber: user.businessPhoneNumber,
      };
      if (user.userType === 'vendor') {
        const supermarket = await this.supermarketModel.create({
          name: user.businessName,
          address: user.address || '',
          description: user.businessDescription || '',
          status: 'open',
          approved: false,
          ownerId: user._id,
        });
        console.log('supermarket created:', supermarket);
        user.supermarket = supermarket._id as mongoose.Schema.Types.ObjectId;
        await user.save();
      }

      return { user: userResponse };
    } catch (error) {
      console.log('Error during user creation:', error);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 11000) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async logIn(logInDto: LogInDto): Promise<{ token: string; user: any }> {
    const { email, password, userType, adminPassKey } = logInDto;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user) {
      throw new NotFoundException('No user found with this email');
    }

    if (userType === 'admin') {
      const envPassKey = ADMIN_PASSKEY;
      if (!adminPassKey || adminPassKey !== envPassKey) {
        throw new UnauthorizedException('Invalid admin passkey');
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.userType !== userType) {
      throw new UnauthorizedException(
        `This account is not registered as a ${userType}`,
      );
    }

    await this.userModel.findByIdAndUpdate(user._id, {
      isLoggedIn: true,
      status: 'active',
    });

    // Generate JWT token
    const payload = {
      id: user._id,
      email: user.email,
      userType: user.userType,
    };
    const token = this.jwtService.sign(payload);

    // Return user without password
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: 'active',
      userType: user.userType,
    };

    return { token, user: userResponse };
  }
  // auth.service.ts
  async logoutUser(userId: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isLoggedIn = false;
    user.status = 'inactive';

    await user.save();

    return { message: 'Logout successful' };
  }
}
