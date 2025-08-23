import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DATABASE_URI } from './common/config';
import { ProfileModule } from './profile/profile.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { SupermarketModule } from './supermarket/supermarket.module';
import { CategoryModule } from './category/category.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentModule } from './payment/payment.module';
import { VerificationModule } from './verification/verification.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { UploadController } from './upload/upload.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(DATABASE_URI as string),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    ProfileModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    SupermarketModule,
    CategoryModule,
    DashboardModule,
    PaymentModule,
    VerificationModule,
    NotificationsModule,
    CloudinaryModule,
  ],
  controllers: [AppController, UploadController],
  providers: [AppService, CloudinaryService],
})
export class AppModule {}
