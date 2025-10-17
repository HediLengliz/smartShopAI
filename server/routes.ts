import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type {
  NLPParseResult,
  RecommendationRequest,
  RecommendationResult,
  ChatbotRequest,
  ChatbotResponse,
} from "@shared/schema";

// ============================================================================
// AI AGENT PLACEHOLDER FUNCTIONS
// These are integration points for your custom AI implementations
// ============================================================================

/**
 * NLP AGENT - Natural Language Parser
 * TODO: Replace with your AI implementation (spaCy, Hugging Face, OpenAI, etc.)
 * 
 * Example integration:
 * - Use spaCy for entity extraction
 * - Call OpenAI API for parsing
 * - Use regex patterns for simple parsing
 */
async function parseNaturalLanguage(text: string, userId: string): Promise<NLPParseResult> {
  // Placeholder implementation - replace with your NLP model
  // This is a simple regex-based parser for demonstration
  
  const items: Array<{ name: string; quantity: number; unit: string }> = [];
  
  // Simple pattern matching (replace with actual NLP)
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(kg|g|l|ml|liters?|kilograms?|grams?|pieces?|pcs|units?)\s+(?:of\s+)?(.+?)(?:,|$)/gi,
    /(\d+(?:\.\d+)?)\s+(.+?)(?:,|$)/gi,
  ];

  let matched = false;
  for (const pattern of patterns) {
    const matches = Array.from(text.matchAll(pattern));
    if (matches.length > 0) {
      matched = true;
      for (const match of matches) {
        if (match[3]) {
          // Pattern with unit
          items.push({
            quantity: parseFloat(match[1]),
            unit: match[2].toLowerCase(),
            name: match[3].trim(),
          });
        } else {
          // Pattern without unit
          items.push({
            quantity: parseFloat(match[1]),
            unit: "units",
            name: match[2].trim(),
          });
        }
      }
      break;
    }
  }

  // Log the NLP request for analytics
  await storage.createNlpLog({
    userId,
    inputText: text,
    parsedData: JSON.stringify(items),
  });

  return {
    items,
    confidence: matched ? 0.85 : 0.3,
  };
}

/**
 * RECOMMENDATION AGENT
 * TODO: Replace with your recommendation algorithm
 * 
 * Example implementations:
 * - Collaborative filtering
 * - Content-based filtering
 * - Hybrid approach
 * - Rule-based recommendations
 */
async function getRecommendations(userId: string, limit = 4): Promise<RecommendationResult> {
  // Placeholder implementation - replace with your recommendation engine
  
  // Get user's order history
  const orders = await storage.getUserOrders(userId);
  const allProducts = await storage.getAllProducts();
  
  // Simple rule-based recommendation: popular products not recently ordered
  const recentProductIds = new Set(
    (await Promise.all(orders.slice(0, 3).map(o => storage.getOrderItems(o.id))))
      .flat()
      .map(item => item.productId)
  );

  const recommendations = allProducts
    .filter(p => !recentProductIds.has(p.id) && p.stock > 0)
    .slice(0, limit)
    .map(p => ({
      productId: p.id,
      productName: p.name,
      reason: "Popular product based on your shopping patterns",
      confidence: 0.75,
    }));

  return { products: recommendations };
}

/**
 * CHATBOT AGENT
 * TODO: Replace with your chatbot implementation
 * 
 * Example integrations:
 * - OpenAI GPT API
 * - Anthropic Claude API
 * - Rasa framework
 * - Custom fine-tuned model
 */
async function processChatbotMessage(request: ChatbotRequest): Promise<ChatbotResponse> {
  // Placeholder implementation - replace with your chatbot AI
  
  const { userId, message } = request;
  
  // Save user message
  await storage.createMessage({
    userId,
    content: message,
    isBot: false,
  });

  // Simple rule-based responses (replace with actual AI)
  let response = "I'm a placeholder chatbot. Replace me with your AI implementation!";
  const suggestions: string[] = [];

  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("help") || lowerMessage.includes("how")) {
    response = "I can help you with creating shopping lists, finding products, and placing orders. What would you like to know?";
    suggestions.push("How do I create a list?", "How does NLP parsing work?", "How do I place an order?");
  } else if (lowerMessage.includes("list")) {
    response = "To create a shopping list, go to the Shopping Lists page and click 'New List'. You can add items using natural language like '3 kg apples'!";
    suggestions.push("Show me products", "How do I add items?");
  } else if (lowerMessage.includes("product")) {
    response = "Browse our product catalog to see all available items. We also provide AI-powered recommendations based on your shopping history!";
    suggestions.push("View my orders", "Get recommendations");
  } else if (lowerMessage.includes("order")) {
    response = "You can view all your past orders in the Orders page. Each order shows items, total amount, and payment status.";
    suggestions.push("Create a new list", "Browse products");
  }

  // Save bot response
  await storage.createMessage({
    userId,
    content: response,
    isBot: true,
  });

  return { response, suggestions };
}

// ============================================================================
// API ROUTES
// ============================================================================

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user for demo (in production, use proper authentication)
  const MOCK_USER_ID = "demo-user-123";

  // Middleware to ensure user exists
  app.use(async (req, res, next) => {
    const user = await storage.getUserByEmail("demo@example.com");
    if (!user) {
      await storage.createUser({
        name: "Demo User",
        email: "demo@example.com",
      });
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
      res.json(lists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lists" });
    }
  });

  // Create new list
  app.post("/api/lists", async (req, res) => {
    try {
      const { title } = req.body;
      const list = await storage.createList({ userId: MOCK_USER_ID, title });
      res.json(list);
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
      res.json(list);
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
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  // Add item to list
  app.post("/api/lists/:id/items", async (req, res) => {
    try {
      const { name, quantity, unit, productId } = req.body;
      const item = await storage.createListItem({
        listId: req.params.id,
        name,
        quantity: quantity || 1,
        unit: unit || "units",
        productId: productId || null,
        status: "pending",
      });
      res.json(item);
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
        listId: req.params.id,
        name: product.name,
        quantity: 1,
        unit: "units",
        productId: product.id,
        status: "pending",
      });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to add product to list" });
    }
  });

  // Update item status
  app.patch("/api/lists/:id/items/:itemId", async (req, res) => {
    try {
      const { status } = req.body;
      const item = await storage.updateListItemStatus(req.params.itemId, status);
      res.json(item);
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
      const result = await parseNaturalLanguage(text, MOCK_USER_ID);
      
      // Add parsed items to the list if provided
      const { listId } = req.body;
      if (listId && result.items.length > 0) {
        for (const item of result.items) {
          await storage.createListItem({
            listId,
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
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Create product (admin)
  app.post("/api/products", async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.json(product);
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
          const items = await storage.getOrderItems(order.id);
          const itemsWithProducts = await Promise.all(
            items.map(async (item) => ({
              ...item,
              product: await storage.getProduct(item.productId),
            }))
          );
          const payment = await storage.getPaymentByOrderId(order.id);
          return {
            ...order,
            items: itemsWithProducts,
            payment,
          };
        })
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
        userId: MOCK_USER_ID,
        status: "pending",
        totalAmount,
      });
      
      // Create order items
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          await storage.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: product.price,
          });
        }
      }
      
      // Create payment
      await storage.createPayment({
        orderId: order.id,
        amount: totalAmount,
        status: "pending",
        paymentMethod,
      });
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Get recommendations - AI INTEGRATION POINT
  app.get("/api/recommendations", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const recommendations = await getRecommendations(MOCK_USER_ID, limit);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  // ============================================================================
  // PAIR 3: CHATBOT + SUPPORT
  // ============================================================================

  // Get all FAQs
  app.get("/api/faq", async (req, res) => {
    try {
      const faqs = await storage.getAllFaqs();
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  // Create FAQ (admin)
  app.post("/api/faq", async (req, res) => {
    try {
      const faq = await storage.createFaq(req.body);
      res.json(faq);
    } catch (error) {
      res.status(500).json({ error: "Failed to create FAQ" });
    }
  });

  // Send chatbot message - AI INTEGRATION POINT
  app.post("/api/chatbot/send", async (req, res) => {
    try {
      const { message } = req.body;
      const response = await processChatbotMessage({
        userId: MOCK_USER_ID,
        message,
      });
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // Get chat history
  app.get("/api/chatbot/messages", async (req, res) => {
    try {
      const messages = await storage.getUserMessages(MOCK_USER_ID);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Submit feedback
  app.post("/api/feedback", async (req, res) => {
    try {
      const { content, rating } = req.body;
      const feedbackRecord = await storage.createFeedback({
        userId: MOCK_USER_ID,
        content,
        rating: rating || null,
      });
      res.json(feedbackRecord);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // Process payment
  app.post("/api/payments", async (req, res) => {
    try {
      const payment = await storage.createPayment(req.body);
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to process payment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
