// Storage layer for Smart Shopping List Application
// Implements DatabaseStorage with PostgreSQL using Drizzle ORM

import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  users,
  lists,
  listItems,
  products,
  orders,
  orderItems,
  faqs,
  messages,
  feedback,
  payments,
  nlpLogs,
  type User,
  type InsertUser,
  type List,
  type InsertList,
  type ListItem,
  type InsertListItem,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Faq,
  type InsertFaq,
  type Message,
  type InsertMessage,
  type Feedback,
  type InsertFeedback,
  type Payment,
  type InsertPayment,
  type NlpLog,
  type InsertNlpLog,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Lists
  getUserLists(userId: string): Promise<List[]>;
  getList(id: string): Promise<List | undefined>;
  createList(list: InsertList): Promise<List>;
  deleteList(id: string): Promise<void>;

  // List Items
  getListItems(listId: string): Promise<ListItem[]>;
  getListItem(id: string): Promise<ListItem | undefined>;
  createListItem(item: InsertListItem): Promise<ListItem>;
  updateListItemStatus(id: string, status: string): Promise<ListItem | undefined>;
  deleteListItem(id: string): Promise<void>;

  // Products
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProductStock(id: string, stock: number): Promise<Product | undefined>;

  // Orders
  getUserOrders(userId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  // Order Items
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  // FAQs
  getAllFaqs(): Promise<Faq[]>;
  createFaq(faq: InsertFaq): Promise<Faq>;

  // Messages
  getUserMessages(userId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Feedback
  createFeedback(feedbackData: InsertFeedback): Promise<Feedback>;

  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentByOrderId(orderId: string): Promise<Payment | undefined>;

  // NLP Logs
  createNlpLog(log: InsertNlpLog): Promise<NlpLog>;
}

export class DatabaseStorage implements IStorage {
  // ============================================================================
  // USERS
  // ============================================================================
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // ============================================================================
  // LISTS
  // ============================================================================

  async getUserLists(userId: string): Promise<List[]> {
    return await db
      .select()
      .from(lists)
      .where(eq(lists.userId, userId))
      .orderBy(desc(lists.createdAt));
  }

  async getList(id: string): Promise<List | undefined> {
    const [list] = await db.select().from(lists).where(eq(lists.id, id));
    return list || undefined;
  }

  async createList(insertList: InsertList): Promise<List> {
    const [list] = await db.insert(lists).values(insertList).returning();
    return list;
  }

  async deleteList(id: string): Promise<void> {
    await db.delete(lists).where(eq(lists.id, id));
  }

  // ============================================================================
  // LIST ITEMS
  // ============================================================================

  async getListItems(listId: string): Promise<ListItem[]> {
    return await db
      .select()
      .from(listItems)
      .where(eq(listItems.listId, listId))
      .orderBy(desc(listItems.createdAt));
  }

  async getListItem(id: string): Promise<ListItem | undefined> {
    const [item] = await db.select().from(listItems).where(eq(listItems.id, id));
    return item || undefined;
  }

  async createListItem(insertItem: InsertListItem): Promise<ListItem> {
    const [item] = await db.insert(listItems).values(insertItem).returning();
    return item;
  }

  async updateListItemStatus(id: string, status: string): Promise<ListItem | undefined> {
    const [item] = await db
      .update(listItems)
      .set({ status })
      .where(eq(listItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteListItem(id: string): Promise<void> {
    await db.delete(listItems).where(eq(listItems.id, id));
  }

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProductStock(id: string, stock: number): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ stock })
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  // ============================================================================
  // ORDERS
  // ============================================================================

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // ============================================================================
  // ORDER ITEMS
  // ============================================================================

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(insertItem: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(insertItem).returning();
    return item;
  }

  // ============================================================================
  // FAQs
  // ============================================================================

  async getAllFaqs(): Promise<Faq[]> {
    return await db.select().from(faqs).orderBy(desc(faqs.createdAt));
  }

  async createFaq(insertFaq: InsertFaq): Promise<Faq> {
    const [faq] = await db.insert(faqs).values(insertFaq).returning();
    return faq;
  }

  // ============================================================================
  // MESSAGES
  // ============================================================================

  async getUserMessages(userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(messages.timestamp);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  // ============================================================================
  // FEEDBACK
  // ============================================================================

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const [feedbackRecord] = await db.insert(feedback).values(insertFeedback).returning();
    return feedbackRecord;
  }

  // ============================================================================
  // PAYMENTS
  // ============================================================================

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId));
    return payment || undefined;
  }

  // ============================================================================
  // NLP LOGS
  // ============================================================================

  async createNlpLog(insertLog: InsertNlpLog): Promise<NlpLog> {
    const [log] = await db.insert(nlpLogs).values(insertLog).returning();
    return log;
  }
}

export const storage = new DatabaseStorage();
