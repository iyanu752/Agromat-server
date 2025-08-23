import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
export type SuperMarketDocument = SuperMarket & Document;

@Schema({ timestamps: true })
export class SuperMarket {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  // @Prop({ required: false, enum: ['open', 'closed'] })
  // status: string;

  @Prop({ required: false })
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  ownerId: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  approved: boolean;

  @Prop({ required: false })
  openTime: string;

  @Prop({ required: false })
  closeTime: string;

  @Prop({ required: false })
  image: string;

  @Prop({
    required: false,
    type: {
      enabled: { type: Boolean, default: false },
      monday: {
        open: { type: String, default: '' },
        close: { type: String, default: '' },
        closed: { type: Boolean, default: false },
      },
      tuesday: {
        open: { type: String, default: '' },
        close: { type: String, default: '' },
        closed: { type: Boolean, default: false },
      },
      wednesday: {
        open: { type: String, default: '' },
        close: { type: String, default: '' },
        closed: { type: Boolean, default: false },
      },
      thursday: {
        open: { type: String, default: '' },
        close: { type: String, default: '' },
        closed: { type: Boolean, default: false },
      },
      friday: {
        open: { type: String, default: '' },
        close: { type: String, default: '' },
        closed: { type: Boolean, default: false },
      },
      saturday: {
        open: { type: String, default: '' },
        close: { type: String, default: '' },
        closed: { type: Boolean, default: false },
      },
      sunday: {
        open: { type: String, default: '' },
        close: { type: String, default: '' },
        closed: { type: Boolean, default: false },
      },
    },
  })
  autoSchedule: Record<string, any>;

  @Prop({ required: false, default: 'Africa/Lagos' })
  timezone: string;

  @Prop({ required: false, default: false })
  holidayMode: boolean;

  @Prop({ required: false, default: false })
  dropshippingMode: boolean;

  @Prop({ required: false, default: false })
  isOpen: boolean;
}

export const SupermarketSchema = SchemaFactory.createForClass(SuperMarket);
