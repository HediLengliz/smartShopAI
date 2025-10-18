// TypeScript interfaces and schemas for Smart Shopping List Application
// MongoDB/Mongoose types and AI agent interfaces

import { z } from "zod";

// ============================================================================
// MONGODB/MONGOOSE TYPES
// ============================================================================

// Base document interface
export interface BaseDocument {
  _id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// User interface
export interface User extends BaseDocument {
  name: string;
  email: string;
}

// List interface
export interface List extends BaseDocument {
  userId: string;
  title: string;
}

// ListItem interface
export interface ListItem extends BaseDocument {
  listId: string;
  productId?: string;
  name: string;
  quantity: number;
  unit: string;
  status: 'pending' | 'urgent' | 'purchased';
}

// Product interface
export interface Product extends BaseDocument {
  name: string;
  description?: string;
  price: number;
  stock: number;
  stockAlertThreshold: number;
  category?: string;
  imageUrl?: string;
}

// Order interface
export interface Order extends BaseDocument {
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalAmount: number;
}

// OrderItem interface
export interface OrderItem extends BaseDocument {
  orderId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
}

// FAQ interface
export interface FAQ extends BaseDocument {
  question: string;
  answer: string;
  category?: string;
}

// Message interface
export interface Message extends BaseDocument {
  userId: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

// Feedback interface
export interface Feedback extends BaseDocument {
  userId: string;
  content: string;
  rating?: number;
}

// Payment interface
export interface Payment extends BaseDocument {
  orderId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
}

// NlpLog interface
export interface NlpLog extends BaseDocument {
  userId: string;
  inputText: string;
  parsedData: string; // JSON string
  timestamp: Date;
}

// ============================================================================
// CREATE DATA TYPES (for API requests)
// ============================================================================

export type CreateUserData = Omit<User, '_id' | 'createdAt' | 'updatedAt'>;
export type CreateListData = Omit<List, '_id' | 'createdAt' | 'updatedAt'>;
export type CreateListItemData = Omit<ListItem, '_id' | 'createdAt' | 'updatedAt'>;
export type CreateProductData = Omit<Product, '_id' | 'createdAt' | 'updatedAt'>;
export type CreateOrderData = Omit<Order, '_id' | 'createdAt' | 'updatedAt'>;
export type CreateOrderItemData = Omit<OrderItem, '_id' | 'createdAt' | 'updatedAt'>;
export type CreateFAQData = Omit<FAQ, '_id' | 'createdAt' | 'updatedAt'>;
export type CreateMessageData = Omit<Message, '_id' | 'createdAt' | 'updatedAt' | 'timestamp'>;
export type CreateFeedbackData = Omit<Feedback, '_id' | 'createdAt' | 'updatedAt'>;
export type CreatePaymentData = Omit<Payment, '_id' | 'createdAt' | 'updatedAt'>;
export type CreateNlpLogData = Omit<NlpLog, '_id' | 'createdAt' | 'updatedAt' | 'timestamp'>;

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email format"),
});

export const createListSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
});

export const createListItemSchema = z.object({
  listId: z.string().min(1, "List ID is required"),
  productId: z.string().optional(),
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required").max(20, "Unit too long"),
  status: z.enum(['pending', 'urgent', 'purchased']).default('pending'),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  price: z.number().min(0, "Price cannot be negative"),
  stock: z.number().min(0, "Stock cannot be negative").default(0),
  stockAlertThreshold: z.number().min(0, "Threshold cannot be negative").default(10),
  category: z.string().max(50, "Category too long").optional(),
  imageUrl: z.string().url("Invalid URL").max(500, "URL too long").optional(),
});

export const createOrderSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']).default('pending'),
  totalAmount: z.number().min(0, "Amount cannot be negative").default(0),
});

export const createOrderItemSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  priceAtPurchase: z.number().min(0, "Price cannot be negative"),
});

export const createFAQSchema = z.object({
  question: z.string().min(1, "Question is required").max(500, "Question too long"),
  answer: z.string().min(1, "Answer is required").max(2000, "Answer too long"),
  category: z.string().max(50, "Category too long").optional(),
});

export const createMessageSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  content: z.string().min(1, "Content is required").max(2000, "Content too long"),
  isBot: z.boolean().default(false),
});

export const createFeedbackSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  content: z.string().min(1, "Content is required").max(1000, "Content too long"),
  rating: z.number().min(1).max(5).optional(),
});

export const createPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  amount: z.number().min(0, "Amount cannot be negative"),
  status: z.enum(['pending', 'completed', 'failed']).default('pending'),
  paymentMethod: z.string().max(50, "Payment method too long").optional(),
});

export const createNlpLogSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  inputText: z.string().min(1, "Input text is required").max(1000, "Input text too long"),
  parsedData: z.string().min(1, "Parsed data is required"),
});

// ============================================================================
// AI AGENT INTERFACES (for your custom implementation)
// ============================================================================

export interface NLPParseResult {
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  confidence: number;
}

export interface RecommendationRequest {
  userId: string;
  limit?: number;
}

export interface RecommendationResult {
  products: Array<{
    productId: string;
    productName: string;
    reason: string;
    confidence: number;
  }>;
}

export interface ChatbotRequest {
  userId: string;
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface ChatbotResponse {
  response: string;
  suggestions?: string[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateListRequest {
  title: string;
}

export interface CreateListItemRequest {
  name: string;
  quantity?: number;
  unit?: string;
  productId?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  stockAlertThreshold?: number;
  category?: string;
  imageUrl?: string;
}

export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  paymentMethod?: string;
}

export interface CreateMessageRequest {
  content: string;
}

export interface CreateFeedbackRequest {
  content: string;
  rating?: number;
}

export interface NLPParseRequest {
  text: string;
  listId?: string;
}

export interface ChatbotSendRequest {
  message: string;
}

// ============================================================================
// ENHANCED RESPONSE TYPES WITH POPULATED DATA
// ============================================================================

export interface ListWithItems extends List {
  items: ListItem[];
  itemsCount: number;
}

export interface OrderWithItems extends Order {
  items: Array<OrderItem & { product: Product }>;
  payment?: Payment;
}

export interface ListItemWithProduct extends ListItem {
  product?: Product;
}

export interface OrderItemWithProduct extends OrderItem {
  product: Product;
}

// ============================================================================
// PAGINATION AND FILTERING
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

export interface ListFilters {
  status?: 'pending' | 'urgent' | 'purchased';
  search?: string;
}

export interface OrderFilters {
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  dateFrom?: Date;
  dateTo?: Date;
}

// ============================================================================
// STATISTICS AND ANALYTICS
// ============================================================================

export interface UserStats {
  totalLists: number;
  totalItems: number;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  mostBoughtCategory: string;
  recentActivity: Array<{
    type: 'list_created' | 'item_added' | 'order_placed';
    description: string;
    timestamp: Date;
  }>;
}

export interface ProductStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  averagePrice: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface APIError {
  message: string;
  code: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// ============================================================================
// SEARCH AND FILTERING
// ============================================================================

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ProductSearchResult extends SearchResult<Product> {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
}
