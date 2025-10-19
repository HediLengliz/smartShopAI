import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  nlpAgent,
  recommendationAgent,
  chatbotAgent,
} from "./services/ai-agents";
import { connectDB } from "./db";
import { Types } from "mongoose";
import type {
  NLPParseResult,
  RecommendationRequest,
  RecommendationResult,
  ChatbotRequest,
  ChatbotResponse,
  ensureStringId,
} from "@shared/schema";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Transform MongoDB documents to use 'id' instead of '_id' for frontend compatibility
function transformDocument<T extends { _id?: any }>(
  doc: T | null | undefined,
): any {
  if (!doc) return doc;
  const { _id, ...rest } = doc as any;
  return { ...rest, id: _id.toString() };
}

function transformDocuments<T extends { _id?: any }>(docs: T[]): any[] {
  return docs.map(transformDocument);
}

// ============================================================================
// AI AGENT INTEGRATION
// Using the AI agent services with mock implementations
// ============================================================================

// ============================================================================
// API ROUTES
// ============================================================================

export async function registerRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB
  await connectDB();

  // Mock user for demo (in production, use proper authentication)
  const MOCK_USER_ID = "507f1f77bcf86cd799439011";

  // Middleware to ensure user exists
  app.use(async (req, res, next) => {
    const user = await storage.getUserByEmail("demo@example.com");
    if (!user) {
      await storage.createUser({
        name: "Demo User",
        email: "demo@example.com",
      } as any);
    }
    next();
  });

  // ============================================================================
  // PAIR 1: NLP AGENT + LISTS
  // ============================================================================

  // Get all lists for user
  app.get("/api/lists", async (req, res) => {
    try {
      const lists = await storage.getUserLists(MOCK_USER_ID);
      res.json(transformDocuments(lists));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lists" });
    }
  });

  // Create new list
  app.post("/api/lists", async (req, res) => {
    try {
      const { title } = req.body;
      const list = await storage.createList({
        userId: MOCK_USER_ID as any,
        title,
      });
      res.json(transformDocument(list));
    } catch (error) {
      res.status(500).json({ error: "Failed to create list" });
    }
  });

  // Get specific list
  app.get("/api/lists/:id", async (req, res) => {
    try {
      const list = await storage.getList(req.params.id);
      if (!list) {
        return res.status(404).json({ error: "List not found" });
      }
      res.json(transformDocument(list));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch list" });
    }
  });

  // Delete list
  app.delete("/api/lists/:id", async (req, res) => {
    try {
      await storage.deleteList(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete list" });
    }
  });

  // Get list items
  app.get("/api/lists/:id/items", async (req, res) => {
    try {
      const items = await storage.getListItems(req.params.id);
      res.json(transformDocuments(items));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  // Add item to list
  app.post("/api/lists/:id/items", async (req, res) => {
    try {
      const { name, quantity, unit, productId } = req.body;
      const item = await storage.createListItem({
        listId: req.params.id as any,
        name,
        quantity: quantity || 1,
        unit: unit || "units",
        productId: productId || undefined,
        status: "pending",
      });
      res.json(transformDocument(item));
    } catch (error) {
      res.status(500).json({ error: "Failed to add item" });
    }
  });

  // Add product to list
  app.post("/api/lists/:id/items/from-product", async (req, res) => {
    try {
      const { productId } = req.body;
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      const item = await storage.createListItem({
        listId: req.params.id as any,
        name: product.name,
        quantity: 1,
        unit: "units",
        productId: product._id as any,
        status: "pending",
      });
      res.json(transformDocument(item));
    } catch (error) {
      res.status(500).json({ error: "Failed to add product to list" });
    }
  });

  // Update item status
  app.patch("/api/lists/:id/items/:itemId", async (req, res) => {
    try {
      const { status } = req.body;
      const item = await storage.updateListItemStatus(
        req.params.itemId,
        status,
      );
      res.json(transformDocument(item));
    } catch (error) {
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // Delete item
  app.delete("/api/lists/:id/items/:itemId", async (req, res) => {
    try {
      await storage.deleteListItem(req.params.itemId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // NLP Parse endpoint - AI INTEGRATION POINT
  app.post("/api/nlp/parse", async (req, res) => {
    try {
      const { text } = req.body;
      const result = await nlpAgent.parseNaturalLanguage(text, MOCK_USER_ID);

      // Add parsed items to the list if provided
      const { listId } = req.body;
      if (listId && result.items.length > 0) {
        for (const item of result.items) {
          await storage.createListItem({
            listId: listId as any,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            status: "pending",
          });
        }
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to parse text" });
    }
  });

  // ============================================================================
  // PAIR 2: RECOMMENDATION AGENT + ORDERS
  // ============================================================================

  // Get all products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(transformDocuments(products));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Create product (admin)
  app.post("/api/products", async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.json(transformDocument(product));
    } catch (error) {
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Get user orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getUserOrders(MOCK_USER_ID);

      // Fetch items and payment for each order
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order._id.toString());
          const itemsWithProducts = await Promise.all(
            items.map(async (item: any) => ({
              ...transformDocument(item),
              product: transformDocument(
                await storage.getProduct(item.productId.toString()),
              ),
            })),
          );
          const payment = await storage.getPaymentByOrderId(
            order._id.toString(),
          );
          return transformDocument({
            ...order,
            items: itemsWithProducts,
            payment: transformDocument(payment),
          });
        }),
      );

      res.json(ordersWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      const { items, paymentMethod } = req.body;

      // Calculate total
      let totalAmount = 0;
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          totalAmount += product.price * item.quantity;
        }
      }

      // Create order
      const order = await storage.createOrder({
        userId: MOCK_USER_ID as any,
        status: "pending",
        totalAmount,
      });

      // Create order items
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          await storage.createOrderItem({
            orderId: order.id as any,
            productId: item.productId as any,
            quantity: item.quantity,
            priceAtPurchase: product.price,
          });
        }
      }

      // Create payment
      await storage.createPayment({
        orderId: order.id as any,
        amount: totalAmount,
        status: "pending",
        paymentMethod,
      });

      res.json(transformDocument(order));
    } catch (error) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Get recommendations - AI INTEGRATION POINT
  app.get("/api/recommendations", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const recommendations =
        await recommendationAgent.getPersonalizedRecommendations(
          MOCK_USER_ID,
          limit,
        );
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  // Get related products
  app.get("/api/recommendations/related/:productId", async (req, res) => {
    try {
      const { productId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const recommendations = await recommendationAgent.getRelatedProducts(
        productId,
        limit,
      );
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get related products" });
    }
  });

  // Get trending products
  app.get("/api/recommendations/trending", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const recommendations =
        await recommendationAgent.getTrendingProducts(limit);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trending products" });
    }
  });

  // ============================================================================
  // PAIR 3: CHATBOT + SUPPORT
  // ============================================================================

  // Get all FAQs
  app.get("/api/faq", async (req, res) => {
    try {
      const faqs = await storage.getAllFaqs();
      res.json(transformDocuments(faqs));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  // Create FAQ (admin)
  app.post("/api/faq", async (req, res) => {
    try {
      const faq = await storage.createFaq(req.body);
      res.json(transformDocument(faq));
    } catch (error) {
      res.status(500).json({ error: "Failed to create FAQ" });
    }
  });

  // Send chatbot message - AI INTEGRATION POINT
  app.post("/api/chatbot/send", async (req, res) => {
    try {
      const { message } = req.body;
      const response = await chatbotAgent.processMessage(MOCK_USER_ID, message);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // Get chat history
  app.get("/api/chatbot/messages", async (req, res) => {
    try {
      const messages = await storage.getUserMessages(MOCK_USER_ID);
      res.json(transformDocuments(messages));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Clear chat history
  app.delete("/api/chatbot/messages", async (req, res) => {
    try {
      console.log('[Clear History] Starting chat history clear process');
      
      // Clear messages from database
      await storage.clearUserMessages(MOCK_USER_ID);
      console.log('[Clear History] Database messages cleared');
      
      // Also clear Python chatbot memory if available and reset fallback mode
      try {
        const { chatbotService } = await import('./services/chatbot-service');
        
        // Reset fallback mode first to enable AI calls
        chatbotService.resetFallbackMode();
        
        // Clear Python chatbot memory
        await chatbotService.clearPythonChatbotMemory();
        
        console.log('[Clear History] Python chatbot memory cleared and fallback mode reset');
      } catch (error) {
        console.warn('[Clear History] Could not clear Python chatbot memory:', error);
        // Still reset fallback mode even if clearing memory fails
        try {
          const { chatbotService } = await import('./services/chatbot-service');
          chatbotService.resetFallbackMode();
          console.log('[Clear History] Fallback mode reset despite memory clear failure');
        } catch (resetError) {
          console.error('[Clear History] Failed to reset fallback mode:', resetError);
        }
      }
      
      res.json({ 
        success: true, 
        message: "Chat history cleared successfully and AI reset" 
      });
    } catch (error) {
      console.error('[Clear History] Failed to clear chat history:', error);
      res.status(500).json({ error: "Failed to clear chat history" });
    }
  });

  // Reset chatbot fallback mode
  app.post("/api/chatbot/reset", async (req, res) => {
    try {
      console.log('[Reset Endpoint] Resetting chatbot fallback mode');
      
      const { chatbotService } = await import('./services/chatbot-service');
      const statusBefore = chatbotService.getStatus();
      
      chatbotService.resetFallbackMode();
      
      const statusAfter = chatbotService.getStatus();
      
      console.log(`[Reset Endpoint] Status before: ${JSON.stringify(statusBefore)}`);
      console.log(`[Reset Endpoint] Status after: ${JSON.stringify(statusAfter)}`);
      
      res.json({ 
        success: true, 
        message: "Chatbot fallback mode reset, will try AI again",
        status: statusAfter
      });
    } catch (error) {
      console.error('[Reset Endpoint] Failed to reset chatbot mode:', error);
      res.status(500).json({ error: "Failed to reset chatbot mode" });
    }
  });

  // Chatbot feedback endpoint for learning
  app.post("/api/chatbot/feedback", async (req, res) => {
    try {
      const { messageId, feedback, timestamp } = req.body;
      
      console.log(`[Chatbot Feedback] Received ${feedback} feedback for message ${messageId}`);
      
      // Store feedback for future learning improvements
      // This could be used to improve the chatbot's responses over time
      
      // For now, just log the feedback
      console.log(`[Chatbot Feedback] User ${feedback === 'positive' ? 'liked' : 'disliked'} response at ${timestamp}`);
      
      res.json({ 
        success: true, 
        message: "Feedback received and logged for learning",
        feedback: feedback
      });
    } catch (error) {
      console.error('[Chatbot Feedback] Failed to process feedback:', error);
      res.status(500).json({ error: "Failed to process feedback" });
    }
  });

  // Submit feedback
  app.post("/api/feedback", async (req, res) => {
    try {
      const { content, rating } = req.body;
      const feedbackRecord = await storage.createFeedback({
        userId: MOCK_USER_ID as any,
        content,
        rating: rating || undefined,
      });
      res.json(transformDocument(feedbackRecord));
    } catch (error) {
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // Process payment
  app.post("/api/payments", async (req, res) => {
    try {
      const payment = await storage.createPayment(req.body);
      res.json(transformDocument(payment));
    } catch (error) {
      res.status(500).json({ error: "Failed to process payment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
