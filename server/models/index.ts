import mongoose, { Schema, Document, Types } from 'mongoose';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  createdAt: Date;
}

export interface IList extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  createdAt: Date;
}

export interface IListItem extends Document {
  _id: Types.ObjectId;
  listId: Types.ObjectId;
  productId?: Types.ObjectId;
  name: string;
  quantity: number;
  unit: string;
  status: 'pending' | 'urgent' | 'purchased';
  createdAt: Date;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  stock: number;
  stockAlertThreshold: number;
  category?: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: Date;
}

export interface IOrderItem extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  priceAtPurchase: number;
}

export interface IFAQ extends Document {
  _id: Types.ObjectId;
  question: string;
  answer: string;
  category?: string;
  createdAt: Date;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export interface IFeedback extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  rating?: number;
  createdAt: Date;
}

export interface IPayment extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
  createdAt: Date;
}

export interface INlpLog extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  inputText: string;
  parsedData: string; // JSON string
  timestamp: Date;
}

// ============================================================================
// MONGOOSE SCHEMAS
// ============================================================================

// User Schema
const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // We handle createdAt manually
});

// List Schema
const ListSchema = new Schema<IList>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'List title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// ListItem Schema
const ListItemSchema = new Schema<IListItem>({
  listId: {
    type: Schema.Types.ObjectId,
    ref: 'List',
    required: [true, 'List ID is required']
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0'],
    default: 1
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    default: 'units',
    maxlength: [20, 'Unit cannot exceed 20 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'urgent', 'purchased'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Product Schema
const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  stockAlertThreshold: {
    type: Number,
    required: [true, 'Stock alert threshold is required'],
    min: [0, 'Stock alert threshold cannot be negative'],
    default: 10
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  imageUrl: {
    type: String,
    trim: true,
    maxlength: [500, 'Image URL cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Order Schema
const OrderSchema = new Schema<IOrder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// OrderItem Schema
const OrderItemSchema = new Schema<IOrderItem>({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0']
  },
  priceAtPurchase: {
    type: Number,
    required: [true, 'Price at purchase is required'],
    min: [0, 'Price at purchase cannot be negative']
  }
}, {
  timestamps: false
});

// FAQ Schema
const FAQSchema = new Schema<IFAQ>({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters']
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true,
    maxlength: [2000, 'Answer cannot exceed 2000 characters']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Message Schema
const MessageSchema = new Schema<IMessage>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  isBot: {
    type: Boolean,
    required: [true, 'isBot flag is required'],
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Feedback Schema
const FeedbackSchema = new Schema<IFeedback>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  content: {
    type: String,
    required: [true, 'Feedback content is required'],
    trim: true,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Payment Schema
const PaymentSchema = new Schema<IPayment>({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    trim: true,
    maxlength: [50, 'Payment method cannot exceed 50 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// NlpLog Schema
const NlpLogSchema = new Schema<INlpLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  inputText: {
    type: String,
    required: [true, 'Input text is required'],
    trim: true,
    maxlength: [1000, 'Input text cannot exceed 1000 characters']
  },
  parsedData: {
    type: String,
    required: [true, 'Parsed data is required'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// ============================================================================
// INDEXES FOR PERFORMANCE
// ============================================================================

// User indexes
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

// List indexes
ListSchema.index({ userId: 1 });
ListSchema.index({ createdAt: -1 });

// ListItem indexes
ListItemSchema.index({ listId: 1 });
ListItemSchema.index({ productId: 1 });
ListItemSchema.index({ status: 1 });

// Product indexes
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ createdAt: -1 });

// Order indexes
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

// OrderItem indexes
OrderItemSchema.index({ orderId: 1 });
OrderItemSchema.index({ productId: 1 });

// Message indexes
MessageSchema.index({ userId: 1 });
MessageSchema.index({ timestamp: -1 });

// Feedback indexes
FeedbackSchema.index({ userId: 1 });
FeedbackSchema.index({ createdAt: -1 });

// Payment indexes
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ status: 1 });

// NlpLog indexes
NlpLogSchema.index({ userId: 1 });
NlpLogSchema.index({ timestamp: -1 });

// ============================================================================
// VIRTUAL FIELDS AND METHODS
// ============================================================================

// User virtual for lists count
UserSchema.virtual('listsCount', {
  ref: 'List',
  localField: '_id',
  foreignField: 'userId',
  count: true
});

// List virtual for items count
ListSchema.virtual('itemsCount', {
  ref: 'ListItem',
  localField: '_id',
  foreignField: 'listId',
  count: true
});

// Order virtual for items count
OrderSchema.virtual('itemsCount', {
  ref: 'OrderItem',
  localField: '_id',
  foreignField: 'orderId',
  count: true
});

// ============================================================================
// EXPORT MODELS
// ============================================================================

export const User = mongoose.model<IUser>('User', UserSchema);
export const List = mongoose.model<IList>('List', ListSchema);
export const ListItem = mongoose.model<IListItem>('ListItem', ListItemSchema);
export const Product = mongoose.model<IProduct>('Product', ProductSchema);
export const Order = mongoose.model<IOrder>('Order', OrderSchema);
export const OrderItem = mongoose.model<IOrderItem>('OrderItem', OrderItemSchema);
export const FAQ = mongoose.model<IFAQ>('FAQ', FAQSchema);
export const Message = mongoose.model<IMessage>('Message', MessageSchema);
export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
export const NlpLog = mongoose.model<INlpLog>('NlpLog', NlpLogSchema);

// ============================================================================
// UTILITY TYPES FOR API
// ============================================================================

export type CreateUserData = Omit<IUser, '_id' | 'createdAt'>;
export type CreateListData = Omit<IList, '_id' | 'createdAt'>;
export type CreateListItemData = Omit<IListItem, '_id' | 'createdAt'>;
export type CreateProductData = Omit<IProduct, '_id' | 'createdAt'>;
export type CreateOrderData = Omit<IOrder, '_id' | 'createdAt'>;
export type CreateOrderItemData = Omit<IOrderItem, '_id'>;
export type CreateFAQData = Omit<IFAQ, '_id' | 'createdAt'>;
export type CreateMessageData = Omit<IMessage, '_id' | 'timestamp'>;
export type CreateFeedbackData = Omit<IFeedback, '_id' | 'createdAt'>;
export type CreatePaymentData = Omit<IPayment, '_id' | 'createdAt'>;
export type CreateNlpLogData = Omit<INlpLog, '_id' | 'timestamp'>;

