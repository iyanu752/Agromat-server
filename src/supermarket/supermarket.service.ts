import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SuperMarket } from './supermarketschema';
import { Model } from 'mongoose';
import { User } from 'src/users/userschema';
import {
  CreateSupermarketDto,
  UpdateSupermarketDto,
} from './dto/supermarket.dto';
import * as moment from 'moment';
import { Cron } from '@nestjs/schedule';
import { AutoSchedule, DaySchedule } from 'src/common/auto-schedule.interface';

@Injectable()
export class SupermarketService {
  constructor(
    @InjectModel(SuperMarket.name)
    private supermarketModel: Model<SuperMarket>,

    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  @Cron('0 8,10,12,14,16,18,20,22 * * *')
  async runAutoSchedule(): Promise<void> {
    const supermarkets = await this.supermarketModel.find({
      'autoSchedule.enabled': true,
    });

    for (const market of supermarkets) {
      if (market.holidayMode) {
        market.isOpen = false;
        await market.save();
        continue;
      }

      const schedule = market.autoSchedule as AutoSchedule | undefined;
      const today = moment().format('dddd').toLowerCase() as keyof AutoSchedule;

      const daySchedule = schedule?.[today] as DaySchedule | undefined;

      if (!daySchedule || daySchedule.closed) {
        market.isOpen = false;
        await market.save();
        continue;
      }

      const now = moment();
      const open = moment(daySchedule.open, 'HH:mm');
      const close = moment(daySchedule.close, 'HH:mm');

      if (now.isBetween(open, close)) {
        market.isOpen = true;
      } else {
        market.isOpen = false;
      }

      await market.save();
    }
  }

  @Cron('0 */30 * * * *')
  async checkManualSchedule() {
    const supermarkets = await this.supermarketModel.find({
      'autoSchedule.enabled': false,
      holidayMode: false,
      openTime: { $exists: true },
      closeTime: { $exists: true },
    });
    const now = moment();
    for (const market of supermarkets) {
      const openTime = moment(market.openTime, 'h:mm A');
      const closeTime = moment(market.closeTime, 'h:mm A');
      if (closeTime.isBefore(openTime)) {
        closeTime.add(1, 'day');
      }
      const shouldBeOpen = now.isBetween(openTime, closeTime);
      market.isOpen = shouldBeOpen;
      await market.save();
    }
  }
  async createSupermarket(
    createSupermarketDto: CreateSupermarketDto,
  ): Promise<SuperMarket> {
    try {
      const owner = await this.userModel.findById(createSupermarketDto.ownerId);
      if (!owner) {
        throw new NotFoundException('Owner not found');
      }

      if (owner.userType !== 'vendor') {
        throw new BadRequestException(
          'Only business owners can create supermarkets',
        );
      }

      return this.supermarketModel.create(createSupermarketDto);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create supermarket',
        error,
      );
    }
  }

  async updateHolidayMode(id: string, enabled: boolean): Promise<SuperMarket> {
    const market = await this.supermarketModel.findById(id);
    if (!market) {
      throw new NotFoundException('Supermarket not found');
    }
    market.holidayMode = enabled;
    if (enabled) {
      market.isOpen = false;
    }
    return await market.save();
  }

  async updateDropshippingMode(
    id: string,
    enabled: boolean,
  ): Promise<SuperMarket> {
    const market = await this.supermarketModel.findById(id);
    if (!market) {
      throw new NotFoundException('Supermarket not found');
    }
    market.dropshippingMode = enabled;
    if (enabled) {
      market.isOpen = true;
    }
    return await market.save();
  }

  async verifyDropshippingMode(id: string): Promise<{ enabled: boolean }> {
    const market = await this.supermarketModel.findById(id);

    if (!market) {
      throw new NotFoundException('Supermarket not found');
    }

    return { enabled: market.dropshippingMode === true };
  }

  async getAllSupermarkets(): Promise<SuperMarket[]> {
    try {
      return this.supermarketModel.find();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get supermarkets',
        error,
      );
    }
  }

  async getSupermarketById(id: string): Promise<SuperMarket> {
    try {
      const supermarket = await this.supermarketModel.findById(id);
      if (!supermarket) {
        throw new NotFoundException('Supermarket not found');
      }
      return supermarket;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to get supermarket by Id',
        error,
      );
    }
  }

  async updateSupermarket(
    id: string,
    updateSupermarketDto: UpdateSupermarketDto,
  ): Promise<{ supermarketItem: SuperMarket; message: string }> {
    try {
      const supermarket = await this.supermarketModel.findByIdAndUpdate(
        id,
        updateSupermarketDto,
        { new: true, runValidators: true },
      );

      if (!supermarket) {
        throw new NotFoundException('Supermarket not found');
      }
      return {
        supermarketItem: supermarket,
        message: 'Supermarket updated successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to update supermarket',
        error,
      );
    }
  }

  async deleteSupermarket(id: string): Promise<void> {
    try {
      const supermarket = await this.supermarketModel.findByIdAndDelete(id);
      if (!supermarket) {
        throw new NotFoundException('Supermarket not found');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to delete supermarket',
        error,
      );
    }
  }
}
