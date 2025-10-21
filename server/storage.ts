// Storage layer for Smart Shopping List Application
// Implements DatabaseStorage with MongoDB using Mongoose ODM

import {
  User,
  List,
  ListItem,
  Product,
  Order,
  OrderItem,
  FAQ,
  Message,
  Feedback,
  Payment,
  NlpLog,
  type IUser,
  type IList,
  type IListItem,
  type IProduct,
  type IOrder,
  type IOrderItem,
  type IFAQ,
  type IMessage,
  type IFeedback,
  type IPayment,
  type INlpLog,
} from "./models";
import { Types } from "mongoose";
import type {
  CreateUserData,
  CreateListData,
  CreateListItemData,
  CreateProductData,
  CreateOrderData,
  CreateOrderItemData,
  CreateFAQData,
  CreateMessageData,
  CreateFeedbackData,
  CreatePaymentData,
  CreateNlpLogData,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<IUser | undefined>;
  getUserByEmail(email: string): Promise<IUser | undefined>;
  createUser(user: CreateUserData): Promise<IUser>;

  // Lists
  getUserLists(userId: string): Promise<IList[]>;
  getList(id: string): Promise<IList | undefined>;
  createList(list: CreateListData): Promise<IList>;
  deleteList(id: string): Promise<void>;

  // List Items
  getListItems(listId: string): Promise<IListItem[]>;
  getListItem(id: string): Promise<IListItem | undefined>;
  createListItem(item: CreateListItemData): Promise<IListItem>;
  updateListItemStatus(
    id: string,
    status: string,
  ): Promise<IListItem | undefined>;
  deleteListItem(id: string): Promise<void>;

  // Products
  getAllProducts(): Promise<IProduct[]>;
  getProduct(id: string): Promise<IProduct | undefined>;
  createProduct(product: CreateProductData): Promise<IProduct>;
  updateProduct(
    id: string,
    data: Partial<CreateProductData>,
  ): Promise<IProduct | undefined>;
  deleteProduct(id: string): Promise<void>;

  // Orders
  getUserOrders(userId: string): Promise<IOrder[]>;
  getOrder(id: string): Promise<IOrder | undefined>;
  createOrder(order: CreateOrderData): Promise<IOrder>;
  updateOrderStatus(id: string, status: string): Promise<IOrder | undefined>;

  // Order Items
  getOrderItems(orderId: string): Promise<IOrderItem[]>;
  createOrderItem(item: CreateOrderItemData): Promise<IOrderItem>;

  // FAQs
  getAllFaqs(): Promise<IFAQ[]>;
  createFaq(faq: CreateFAQData): Promise<IFAQ>;

  // Messages
  getUserMessages(userId: string): Promise<IMessage[]>;
  createMessage(message: CreateMessageData): Promise<IMessage>;

  // Feedback
  createFeedback(feedbackData: CreateFeedbackData): Promise<IFeedback>;

  // Payments
  createPayment(payment: CreatePaymentData): Promise<IPayment>;
  getPaymentByOrderId(orderId: string): Promise<IPayment | undefined>;
  updatePaymentStatus(
    paymentId: string,
    status: string,
  ): Promise<IPayment | undefined>;

  // NLP Logs
  createNlpLog(log: CreateNlpLogData): Promise<INlpLog>;
  getNlpLogs(userId: string): Promise<INlpLog[]>;
}

export class DatabaseStorage implements IStorage {
  // ============================================================================
  // USERS
  // ============================================================================

  async getUser(id: string): Promise<IUser | undefined> {
    const result = await User.findById(id).lean();
    return result as any;
  }

  async getUserByEmail(email: string): Promise<IUser | undefined> {
    const result = await User.findOne({ email }).lean();
    return result as any;
  }

  async createUser(insertUser: CreateUserData): Promise<IUser> {
    const user = new User(insertUser);
    await user.save();
    return user;
  }

  // ============================================================================
  // LISTS
  // ============================================================================

  async getUserLists(userId: string): Promise<IList[]> {
    const results = await List.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).lean();
    return results as any;
  }

  async getList(id: string): Promise<IList | undefined> {
    const result = await List.findById(id).lean();
    return result as any;
  }

  async createList(insertList: CreateListData): Promise<IList> {
    const list = new List(insertList);
    await list.save();
    return list;
  }

  async deleteList(id: string): Promise<void> {
    // Also delete all list items
    await ListItem.deleteMany({ listId: id });
    await List.findByIdAndDelete(id);
  }

  // ============================================================================
  // LIST ITEMS
  // ============================================================================

  async getListItems(listId: string): Promise<IListItem[]> {
    const results = await ListItem.find({ listId })
      .populate("productId", "name price imageUrl")
      .sort({ createdAt: -1 })
      .lean();
    return results as any;
  }

  async getListItem(id: string): Promise<IListItem | undefined> {
    const result = await ListItem.findById(id)
      .populate("productId", "name price imageUrl")
      .lean();
    return result as any;
  }

  async createListItem(insertItem: CreateListItemData): Promise<IListItem> {
    const item = new ListItem(insertItem);
    await item.save();
    const result = await ListItem.findById(item._id)
      .populate("productId", "name price imageUrl")
      .lean();
    return result as any;
  }

  async updateListItemStatus(
    id: string,
    status: string,
  ): Promise<IListItem | undefined> {
    const result = await ListItem.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    )
      .populate("productId", "name price imageUrl")
      .lean();
    return result as any;
  }

  async deleteListItem(id: string): Promise<void> {
    await ListItem.findByIdAndDelete(id);
  }

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  async getAllProducts(): Promise<IProduct[]> {
    const results = await Product.find().sort({ createdAt: -1 }).lean();
    return results as any;
  }

  async getProduct(id: string): Promise<IProduct | undefined> {
    const result = await Product.findById(id).lean();
    return result as any;
  }

  async createProduct(insertProduct: CreateProductData): Promise<IProduct> {
    const product = new Product(insertProduct);
    await product.save();
    return product;
  }

  async updateProduct(
    id: string,
    data: Partial<CreateProductData>,
  ): Promise<IProduct | undefined> {
    const result = await Product.findByIdAndUpdate(id, data, {
      new: true,
    }).lean();
    return result as any;
  }

  async deleteProduct(id: string): Promise<void> {
    await Product.findByIdAndDelete(id);
  }

  // ============================================================================
  // ORDERS
  // ============================================================================

  async getUserOrders(userId: string): Promise<IOrder[]> {
    const results = await Order.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).lean();
    return results as any;
  }

  async getOrder(id: string): Promise<IOrder | undefined> {
    const result = await Order.findById(id).lean();
    return result as any;
  }

  async createOrder(insertOrder: CreateOrderData): Promise<IOrder> {
    const order = new Order(insertOrder);
    await order.save();
    return order;
  }

  async updateOrderStatus(
    id: string,
    status: string,
  ): Promise<IOrder | undefined> {
    const result = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).lean();
    return result as any;
  }

  // ============================================================================
  // ORDER ITEMS
  // ============================================================================

  async getOrderItems(orderId: string): Promise<IOrderItem[]> {
    const results = await OrderItem.find({ orderId })
      .populate("productId", "name price imageUrl")
      .lean();
    return results as any;
  }

  async createOrderItem(insertItem: CreateOrderItemData): Promise<IOrderItem> {
    const item = new OrderItem(insertItem);
    await item.save();
    const result = await OrderItem.findById(item._id)
      .populate("productId", "name price imageUrl")
      .lean();
    return result as any;
  }

  // ============================================================================
  // FAQs
  // ============================================================================

  async getAllFaqs(): Promise<IFAQ[]> {
    const results = await FAQ.find().sort({ createdAt: -1 }).lean();
    return results as any;
  }

  async createFaq(insertFaq: CreateFAQData): Promise<IFAQ> {
    const faq = new FAQ(insertFaq);
    await faq.save();
    return faq;
  }

  // ============================================================================
  // MESSAGES
  // ============================================================================

  async getUserMessages(userId: string): Promise<IMessage[]> {
    const results = await Message.find({ userId: new Types.ObjectId(userId) })
      .sort({ timestamp: -1 })
      .lean();
    return results as any;
  }

  async createMessage(insertMessage: CreateMessageData): Promise<IMessage> {
    const message = new Message(insertMessage);
    await message.save();
    return message;
  }

  // ============================================================================
  // FEEDBACK
  // ============================================================================

  async createFeedback(insertFeedback: CreateFeedbackData): Promise<IFeedback> {
    const feedback = new Feedback(insertFeedback);
    await feedback.save();
    return feedback;
  }

  // ============================================================================
  // PAYMENTS
  // ============================================================================

  async createPayment(insertPayment: CreatePaymentData): Promise<IPayment> {
    const payment = new Payment(insertPayment);
    await payment.save();
    return payment;
  }

  async getPaymentByOrderId(orderId: string): Promise<IPayment | undefined> {
    const result = await Payment.findOne({ orderId }).lean();
    return result as any;
  }

  async updatePaymentStatus(
    paymentId: string,
    status: string,
  ): Promise<IPayment | undefined> {
    const result = await Payment.findByIdAndUpdate(
      paymentId,
      { status },
      { new: true },
    ).lean();
    return result as any;
  }

  // ============================================================================
  // NLP LOGS
  // ============================================================================

  async createNlpLog(insertLog: CreateNlpLogData): Promise<INlpLog> {
    const log = new NlpLog(insertLog);
    await log.save();
    return log;
  }

  async getNlpLogs(userId: string): Promise<INlpLog[]> {
    const results = await NlpLog.find({ userId: new Types.ObjectId(userId) })
      .sort({ timestamp: -1 })
      .lean();
    return results as any;
  }
}

export const storage = new DatabaseStorage();
