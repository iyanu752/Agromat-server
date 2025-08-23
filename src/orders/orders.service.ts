/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types, isValidObjectId } from 'mongoose';
import { Orders } from './orderschema';
import { User } from 'src/users/userschema';
import { CreateOrderDto, VerifyPaymentDto } from './dto/orders.dto';
import { PaymentService } from 'src/payment/payment.service';
import { CartService } from 'src/cart/cart.service';
import { VerificationService } from 'src/verification/verification.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { SuperMarket } from 'src/supermarket/supermarketschema';
// import { VerifyOrderDto } from 'src/verification/dto/verify-order.dto';
@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Orders.name)
    private orderModel: Model<Orders>,
    @InjectModel(SuperMarket.name)
    private supermarketModel: Model<SuperMarket>,
    private paystackService: PaymentService,
    private cartService: CartService,
    private notificationsGateway: NotificationsGateway,
    private verificationService: VerificationService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  private async isDropshippingEnabled(supermarketId: string): Promise<boolean> {
    const market = await this.supermarketModel.findById(supermarketId);
    if (!market) {
      throw new NotFoundException('Supermarket not found');
    }
    return market.dropshippingMode === true;
  }

  async createOrder(
    createOrderDto: CreateOrderDto,
  ): Promise<{ orders: Orders; message: string; success: boolean }> {
    try {
      if (!createOrderDto.userId) {
        throw new BadRequestException('User ID is required');
      }
      if (!createOrderDto.items || createOrderDto.items.length === 0) {
        throw new BadRequestException('Order items are required');
      }
      if (!createOrderDto.totalAmount || createOrderDto.totalAmount <= 0) {
        throw new BadRequestException('Valid total amount is required');
      }
      if (!createOrderDto.deliveryAddress) {
        throw new BadRequestException('Delivery address is required');
      }
      const verificationCode = this.verificationService.generateCode();

      const newOrder = new this.orderModel({
        ...createOrderDto,
        verificationCode,
        paymentStatus:
          createOrderDto.paymentStatus === 'success' ? 'success' : 'pending',
        createdAt: new Date(),
      });

      const savedOrder = await newOrder.save();
      if (createOrderDto.supermarketId) {
        const dropshippingEnabled = await this.isDropshippingEnabled(
          createOrderDto.supermarketId,
        );

        if (!dropshippingEnabled) {
          this.notificationsGateway.server.emit('orderPlaced', {
            message: `New order has been added.`,
            product: savedOrder,
          });
        }
      }

      return {
        success: true,
        orders: savedOrder,
        message: 'Order created successfully',
      };
    } catch (error) {
      console.error('❌ Error creating order:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle mongoose validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(
          (err: any) => err.message,
        );
        throw new BadRequestException(
          `Validation failed: ${validationErrors.join(', ')}`,
        );
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
        throw new BadRequestException(
          'Order with this reference already exists',
        );
      }

      throw new InternalServerErrorException('Failed to create order');
    }
  }

  async verifyPaymentAndCreateOrder(
    verifyPaymentDto: VerifyPaymentDto,
  ): Promise<Orders> {
    try {
      // Verify payment with Paystack
      const verification = await this.paystackService.verifyTransaction(
        verifyPaymentDto.reference,
      );

      if (!verification.status || verification.data.status !== 'success') {
        throw new BadRequestException('Payment verification failed');
      }

      // Check if order already exists with this payment reference
      const existingOrder = await this.orderModel.findOne({
        paymentReference: verifyPaymentDto.reference,
      });

      if (existingOrder) {
        return existingOrder; // Return existing order if already created
      }

      // Create order from cart items
      const orderItems = verifyPaymentDto.cartItems.map(
        (item: {
          productId: string;
          quantity: number;
          supermarket: string;
        }) => ({
          product: item.productId,
          quantity: item.quantity,
          supermarket: item.supermarket,
        }),
      );

      const totalAmount = verification.data.amount / 100; // Convert from kobo

      const orderData: CreateOrderDto = {
        userId: verifyPaymentDto.userId,
        items: orderItems,
        totalAmount,
        deliveryAddress: verifyPaymentDto.deliveryAddress,
        deliveryInstructions: verifyPaymentDto.deliveryInstructions || '',
        paymentReference: verifyPaymentDto.reference,
        paymentStatus: 'success',
        status: 'pending',
        orderId: verifyPaymentDto.orderId,
        supermarketId: verifyPaymentDto.supermarketId,
      };

      const newOrder = new this.orderModel({
        ...orderData,
        status: 'pending',
        paidAt: new Date(verification.data.paid_at),
      });

      const savedOrder = await newOrder.save();
      await this.cartService.clearCart(verifyPaymentDto.userId);
      // const firstItem = savedOrder.items[0];

      // let supermarketId: string;

      // if (firstItem.supermarket instanceof Types.ObjectId) {
      //   supermarketId = firstItem.supermarket.toString();
      // } else if (
      //   typeof firstItem.supermarket === 'object' &&
      //   '_id' in firstItem.supermarket
      // ) {
      //   // supermarketId = (
      //   //   firstItem.supermarket as { _id: Types.ObjectId }
      //   // )._id.toString();
      // } else {
      //   throw new Error('Invalid supermarket value in order item');
      // }

      // this.orderGateway.emitNewOrderToVendor(savedOrder, supermarketId);
      // TODO: Here you might want to:
      // 1. Clear the user's cart
      // 2. Send confirmation email
      // 3. Update inventory
      // 4. Notify relevant parties

      return savedOrder;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new BadRequestException(
        'Failed to verify payment and create order',
      );
    }
  }

  async createPendingOrder(orderData: {
    userId: string;
    items: any[];
    totalAmount: number;
    deliveryAddress: string;
    deliveryInstructions?: string;
    orderId: string;
    supermarketId?: string; // Add this field
  }): Promise<Orders> {
    const newOrder = new this.orderModel({
      ...orderData,
      status: 'pending',
      paymentStatus: 'pending',
    });

    const savedOrder = await newOrder.save();

    if (orderData.supermarketId) {
      const dropshippingEnabled = await this.isDropshippingEnabled(
        orderData.supermarketId,
      );

      if (!dropshippingEnabled) {
        this.notificationsGateway.server.emit('orderPlaced', {
          message: `New order has been added.`,
          product: savedOrder,
        });
      }
    }

    return savedOrder;
  }

  async getOrdersForVendor(vendorId: string) {
    return this.orderModel
      .find({ 'items.supermarket': vendorId })
      .populate('userId')
      .populate('items.product')
      .populate('items.supermarket')
      .exec();
  }

  async getOrdersByUserId(userId: string): Promise<Orders[]> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException('Invalid userId format');
    }

    console.log('Fetching orders for userId:', userId);

    const orders = await this.orderModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('items.product')
      .sort({ createdAt: -1 })
      .exec();

    return orders;
  }
  async updatePaymentStatus(
    orderId: string,
    paymentReference: string,
    paymentStatus: 'success' | 'failed',
  ): Promise<Orders> {
    const order = await this.orderModel.findOne({ orderId });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.paymentReference = paymentReference;
    order.paymentStatus = paymentStatus;

    if (paymentStatus === 'success') {
      order.paymentStatus = 'success';
      order.paidAt = new Date();
    } else {
      order.paymentStatus = 'failed';
    }

    return await order.save();
  }

  // ... rest of your existing methods remain the same ...

  async getAllOrders(): Promise<Orders[]> {
    const orders = await this.orderModel
      .find()
      .populate('userId')
      .populate('items.product');
    return orders;
  }

  async getOrderById(orderId: string): Promise<Orders> {
    const order = await this.orderModel
      .findById(orderId)
      .populate('userId')
      .populate('items.product')
      .exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async getOrderByOrderId(orderId: string): Promise<Orders> {
    const order = await this.orderModel
      .findOne({ orderId })
      .populate('userId')
      .populate('items.product')
      .exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async updateOrderStatus(
    orderId: string,
    status: string,
  ): Promise<{ orders: Orders }> {
    const order = await this.orderModel.findOne({ orderId });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }
    const orderStatus = await order.save();

    this.notificationsGateway.server.emit('orderStatusUpdate', {
      message: `Order has been packed`,
      orders: orderStatus,
    });

    return { orders: orderStatus };
  }

  async deleteOrder(orderId: string): Promise<void> {
    const order = await this.orderModel.findByIdAndDelete(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return;
  }

  async getOrderCountByUserId(userId: string): Promise<number> {
    const count = await this.orderModel.countDocuments({ userId });
    return count;
  }

  async getTotalAmountByUserId(userId: string): Promise<number> {
    const orders = await this.orderModel.find({
      userId,
      paymentStatus: 'success',
    });
    return orders.reduce((total, order) => total + order.totalAmount, 0);
  }

  async getOrderCount(): Promise<number> {
    const count = await this.orderModel.countDocuments();
    return count;
  }

  async getOrderHistoryByUser(userId: string) {
    const user = await this.userModel.findById(userId).exec();

    if (!user) throw new NotFoundException('User not found');

    switch (user.userType) {
      case 'user':
        // 🧍 User → Orders they made
        return this.orderModel
          .find({ userId: user._id })
          .sort({ createdAt: -1 })
          .populate('items.product')
          .populate('items.supermarket')
          .exec();

      case 'vendor':
        if (!user.supermarket) {
          throw new BadRequestException('Vendor has no supermarketId');
        }
        return this.orderModel
          .find({ 'items.supermarket': user.supermarket })
          .sort({ createdAt: -1 })
          .populate('userId')
          .populate('items.product')
          .exec();

      case 'rider':
        return this.orderModel
          .find({ assignedRider: user._id })
          .sort({ createdAt: -1 })
          .populate('userId')
          .populate('items.product')
          .exec();

      case 'admin':
        return this.orderModel
          .find()
          .sort({ createdAt: -1 })
          .populate('userId')
          .populate('items.product')
          .exec();

      default:
        throw new NotFoundException('Unsupported user type');
    }
  }

  async assignRiderToOrder(orderId: string, userId: string) {
    const order = await this.orderModel.findOne({ orderId });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.userType !== 'rider') {
      throw new BadRequestException('Only riders can be assigned to orders');
    }

    if (order.assignedRider) {
      if (order.assignedRider.toString() === userId) {
        throw new BadRequestException(
          'This order is already assigned to this rider',
        );
      }
      throw new BadRequestException(
        'Order is already assigned to another rider',
      );
    }

    order.assignedRider = user._id;
    const savedOrder = await order.save();
    this.notificationsGateway.server.emit('riderAcceptNotification', {
      message: `Order has been assigned to Rider`,
      product: savedOrder,
    });
    // this.orderGateway.emitOrderAssignedToRider(order, userId);

    return order;
  }
  async verifyOrderCode(
    orderId: string,
    code: string,
  ): Promise<{ success: boolean }> {
    const order = await this.orderModel.findOne({ orderId });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const isMatch = order.verificationCode === code;
    return { success: isMatch };
  }
}
