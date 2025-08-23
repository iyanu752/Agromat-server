import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Param,
  Patch,
} from '@nestjs/common';
import { SupermarketService } from './supermarket.service';
import {
  CreateSupermarketDto,
  UpdateSupermarketDto,
} from './dto/supermarket.dto';
import { SuperMarket } from './supermarketschema';

@Controller('supermarket')
export class SupermarketController {
  constructor(private supermarketService: SupermarketService) {}

  @Post('/')
  async createSupermarket(
    @Body() createSupermarketDto: CreateSupermarketDto,
  ): Promise<SuperMarket> {
    return await this.supermarketService.createSupermarket(
      createSupermarketDto,
    );
  }

  @Get()
  async getAllSupermarkets(): Promise<SuperMarket[]> {
    return await this.supermarketService.getAllSupermarkets();
  }

  @Get(':id')
  async getSupermarketById(@Param('id') id: string): Promise<SuperMarket> {
    return await this.supermarketService.getSupermarketById(id);
  }

  @Patch(':id/holiday-mode')
  async toggleHolidayMode(
    @Param('id') id: string,
    @Body() body: { enabled: boolean },
  ) {
    return await this.supermarketService.updateHolidayMode(id, body.enabled);
  }

  @Patch(':id/dropshipping-mode')
  async toggleDropshippingMode(
    @Param('id') id: string,
    @Body() body: { enabled: boolean },
  ) {
    return await this.supermarketService.updateDropshippingMode(
      id,
      body.enabled,
    );
  }

  @Put(':id')
  async updateSupermarket(
    @Param('id') id: string,
    @Body() updateSupermarketDto: UpdateSupermarketDto,
  ): Promise<{ supermarketItem: any; message: string }> {
    return await this.supermarketService.updateSupermarket(
      id,
      updateSupermarketDto,
    );
  }

  @Delete(':id')
  async deleteSupermarket(@Param('id') id: string): Promise<void> {
    return await this.supermarketService.deleteSupermarket(id);
  }
}
