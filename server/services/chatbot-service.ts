// Chatbot Service for SmartShopAI
// Integrates with Python-trained chatbot model

import { storage } from "../storage";
import type { ChatbotResponse } from "@shared/schema";
import { recommendationAgent } from "./ai-agents";

interface ChatbotAPIResponse {
  response: string;
  intent: string;
  confidence: number;
  suggestions: string[];
  timestamp: string;
}

class ChatbotService {
  private pythonChatbotUrl: string;
  private fallbackMode: boolean = false;
  private userContext: Map<string, any> = new Map();

  constructor() {
    // Force the correct URL since env var seems to not be loading properly
    this.pythonChatbotUrl = 'http://localhost:5001';
    console.log(`[Chatbot Service] Python AI URL set to: ${this.pythonChatbotUrl}`);
    console.log(`[Chatbot Service] Environment PYTHON_CHATBOT_URL: ${process.env.PYTHON_CHATBOT_URL}`);
  }

  /**
   * Process user message using Python-trained chatbot
   */
  async processMessage(
    userId: string,
    message: string,
    history?: Array<{ role: string; content: string }>
  ): Promise<ChatbotResponse> {
    console.log(`[Chatbot Service] Processing message from user ${userId}: "${message}"`);

    try {
      // Save user message to database
      await storage.createMessage({
        userId: userId as any,
        content: message,
        isBot: false,
      });

      // Update user context for personalized responses
      this.updateUserContext(userId, message, 'general');

      // First, check if the message matches any FAQ
      const faqResponse = await this.checkFAQ(message);
      if (faqResponse) {
        console.log('[Chatbot Service] Found FAQ match, using FAQ response');
        
        // Save FAQ response to database
        await storage.createMessage({
          userId: userId as any,
          content: faqResponse.response,
          isBot: true,
        });

        return faqResponse;
      }

      // Check if message contains products or is a conversational response
      const entities = this.extractProductEntities(message);
      const lowerMessage = message.toLowerCase();
      const isConversationalResponse = ['yes', 'yeah', 'sure', 'ok', 'okay', 'no', 'nope'].includes(lowerMessage);
      
      // Also check for shopping-related keywords
      const shoppingKeywords = ['need', 'want', 'buy', 'get', 'find', 'looking for', 'shopping'];
      const hasShoppingIntent = shoppingKeywords.some(keyword => lowerMessage.includes(keyword));
      
      let response: ChatbotResponse;
      
      console.log('[Chatbot Service] Processing message:', message);
      console.log('[Chatbot Service] Found products:', entities.products);
      console.log('[Chatbot Service] Has shopping intent:', hasShoppingIntent);
      console.log('[Chatbot Service] Is conversational:', isConversationalResponse);
      
      // Always try Python chatbot first for better AI responses
      if (!this.fallbackMode) {
        try {
          response = await this.callPythonChatbot(userId, message);
          
          // Validate response quality
          if (!response || !response.response || response.response.trim().length === 0) {
            throw new Error('Empty or invalid response from Python chatbot');
          }
          
        } catch (error) {
          console.warn('[Chatbot Service] Python chatbot unavailable, using enhanced fallback:', error);
          this.fallbackMode = true;
          response = await this.getEnhancedFallbackResponse(message, userId);
        }
      } else {
        response = await this.getEnhancedFallbackResponse(message, userId);
      }

      // Update context with bot message
      this.updateBotMessageContext(userId, response.response);
      
      // Save bot response to database
      await storage.createMessage({
        userId: userId as any,
        content: response.response,
        isBot: true,
      });

      return response;

    } catch (error) {
      console.error('[Chatbot Service] Error processing message:', error);
      
      // Fallback response
      const fallbackResponse: ChatbotResponse = {
        response: "I'm sorry, I'm having trouble processing your message right now. Please try again later.",
        suggestions: ["How can I help you?", "Ask me about shopping lists", "Need product recommendations?"]
      };

      return fallbackResponse;
    }
  }

  /**
   * Call Python chatbot API with retry logic and backoff
   */
  private async callPythonChatbot(userId: string, message: string): Promise<ChatbotResponse> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second base delay
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Chatbot Service] Attempting to call Python AI (attempt ${attempt}/${maxRetries})`);
        console.log(`[Chatbot Service] Python AI URL: ${this.pythonChatbotUrl}/api/chatbot/process`);
        
        const response = await fetch(`${this.pythonChatbotUrl}/api/chatbot/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            user_id: userId
          }),
          // Add timeout
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        console.log(`[Chatbot Service] Python AI response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Chatbot Service] Python AI API error: ${response.status} - ${errorText}`);
          
          // If it's the last attempt, throw the error
          if (attempt === maxRetries) {
            throw new Error(`Python chatbot API error: ${response.status} - ${errorText}`);
          }
          
          // For non-404 errors, retry with exponential backoff
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`[Chatbot Service] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        const data: ChatbotAPIResponse = await response.json();
        console.log(`[Chatbot Service] Python AI call successful on attempt ${attempt}`);
        
        return {
          response: data.response,
          suggestions: data.suggestions || []
        };
        
      } catch (error) {
        console.error(`[Chatbot Service] Python AI call failed on attempt ${attempt}:`, error);
        
        // If it's the last attempt, throw the error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Retry with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[Chatbot Service] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Check if message matches any FAQ and return response if found
   */
  private async checkFAQ(message: string): Promise<ChatbotResponse | null> {
    try {
      console.log('[Chatbot Service] Checking FAQ for message:', message);
      
      // Get all FAQs from database
      const faqs = await storage.getAllFaqs();
      console.log(`[Chatbot Service] Found ${faqs.length} FAQs to check`);
      
      const messageLower = message.toLowerCase().trim();
      
      // Enhanced FAQ matching with multiple strategies
      let bestMatch = null;
      let bestScore = 0;
      
      for (const faq of faqs) {
        const questionLower = faq.question.toLowerCase();
        const score = this.calculateFAQSimilarity(messageLower, questionLower);
        
        console.log(`[Chatbot Service] FAQ "${faq.question}" similarity score: ${score}`);
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = faq;
        }
      }
      
      // Use a higher threshold for better accuracy
      if (bestScore >= 0.6 && bestMatch) {
        console.log(`[Chatbot Service] FAQ match found: "${bestMatch.question}" (score: ${bestScore})`);
        return {
          response: bestMatch.answer,
          suggestions: [
            "Is there anything else I can help with?",
            "Would you like to see more FAQs?",
            "How can I assist you further?"
          ]
        };
      }
      
      console.log('[Chatbot Service] No FAQ match found (best score:', bestScore, ')');
      return null;
      
    } catch (error) {
      console.error('[Chatbot Service] Error checking FAQ:', error);
      return null;
    }
  }

  /**
   * Calculate similarity score between user message and FAQ question
   */
  private calculateFAQSimilarity(message: string, question: string): number {
    // Strategy 1: Exact phrase matching (highest priority)
    if (message.includes(question) || question.includes(message)) {
      return 0.95;
    }
    
    // Strategy 2: Key phrase matching
    const keyPhrases = [
      { phrase: 'create a shopping list', keywords: ['create', 'shopping', 'list', 'make', 'new'] },
      { phrase: 'ai parsing', keywords: ['ai', 'parsing', 'natural', 'language', 'understand'] },
      { phrase: 'add items manually', keywords: ['add', 'items', 'manually', 'one by one'] },
      { phrase: 'recommendations work', keywords: ['recommendations', 'suggestions', 'personalized', 'how do'] },
      { phrase: 'payment methods', keywords: ['payment', 'methods', 'pay', 'credit', 'card'] },
      { phrase: 'track order status', keywords: ['track', 'order', 'status', 'delivery', 'package'] },
      { phrase: 'mark items urgent', keywords: ['mark', 'items', 'urgent', 'important', 'priority'] },
      { phrase: 'browse products', keywords: ['browse', 'products', 'catalog', 'items', 'show me'] },
      { phrase: 'use the chatbot', keywords: ['use', 'chatbot', 'how to', 'help'] },
      { phrase: 'personalized recommendations', keywords: ['personalized', 'recommendations', 'suggestions'] }
    ];
    
    for (const { phrase, keywords } of keyPhrases) {
      if (question.includes(phrase)) {
        const matchingKeywords = keywords.filter(keyword => 
          message.includes(keyword) || message.includes(keyword + 's')
        );
        const score = matchingKeywords.length / keywords.length;
        if (score >= 0.5) {
          return Math.min(0.9, 0.6 + (score * 0.3));
        }
      }
    }
    
    // Strategy 3: Word overlap scoring
    const messageWords = this.extractSignificantWords(message);
    const questionWords = this.extractSignificantWords(question);
    
    const intersection = messageWords.filter(word => questionWords.includes(word));
    const union = Array.from(new Set([...messageWords, ...questionWords]));
    
    const jaccardSimilarity = intersection.length / union.length;
    
    // Strategy 4: Synonym matching
    const synonymScore = this.calculateSynonymSimilarity(messageWords, questionWords);
    
    // Combine scores with weights
    const finalScore = Math.max(jaccardSimilarity, synonymScore * 0.8);
    
    return Math.min(0.95, finalScore);
  }

  /**
   * Extract significant words (remove common words, normalize)
   */
  private extractSignificantWords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why', 'can', 'do', 'does', 'is', 'are', 'was', 'were']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .map(word => word.replace(/s$/, '')); // Remove plural 's'
  }

  /**
   * Calculate similarity using synonyms and related terms
   */
  private calculateSynonymSimilarity(messageWords: string[], questionWords: string[]): number {
    const synonymGroups = [
      ['create', 'make', 'new', 'add'],
      ['shopping', 'grocery', 'store', 'market'],
      ['list', 'cart', 'basket'],
      ['product', 'item', 'goods', 'things'],
      ['track', 'follow', 'monitor', 'check'],
      ['order', 'purchase', 'buy'],
      ['recommendation', 'suggestion', 'advice'],
      ['browse', 'view', 'see', 'look'],
      ['payment', 'pay', 'money', 'cost'],
      ['urgent', 'important', 'priority', 'critical']
    ];
    
    let maxScore = 0;
    
    for (const group of synonymGroups) {
      const messageMatches = messageWords.filter(word => group.includes(word)).length;
      const questionMatches = questionWords.filter(word => group.includes(word)).length;
      
      if (messageMatches > 0 && questionMatches > 0) {
        const score = (messageMatches + questionMatches) / (group.length * 2);
        maxScore = Math.max(maxScore, score);
      }
    }
    
    return maxScore;
  }

  /**
   * Get enhanced fallback response when Python chatbot is unavailable
   */
  private async getEnhancedFallbackResponse(message: string, userId: string): Promise<ChatbotResponse> {
    try {
      // Try to provide more intelligent fallback responses
      const lowerMessage = message.toLowerCase();
      
      // Check for conversational responses first
      const context = this.getUserContext(userId);
      
      // Handle "yes" responses to previous suggestions
      if (lowerMessage === 'yes' || lowerMessage === 'yeah' || lowerMessage === 'sure' || lowerMessage === 'ok' || lowerMessage === 'okay') {
        console.log('[Chatbot Service] Handling "yes" response, context:', context);
        
        // Check if the last bot message mentioned shopping list
        if (context.lastIntent === 'shopping_list_offer' || 
            context.lastBotMessage?.toLowerCase().includes('shopping list') ||
            context.lastBotMessage?.toLowerCase().includes('create a shopping list')) {
          return {
            response: '📝 Great! To create your shopping list:\n\n1. Go to the "Shopping Lists" page in the sidebar\n2. Click "New List" button\n3. Give your list a name\n4. Start adding items using natural language like "2kg apples, 1 liter milk"\n\nI can help you add those items (milk, bread) to your new list!',
            suggestions: ['Add milk and bread to list', 'Browse more products', 'Get recommendations', 'View my lists']
          };
        } else {
          // Generic positive response
          return {
            response: '👍 Great! What would you like me to help you with? I can assist with shopping lists, product recommendations, or answer any questions you have.',
            suggestions: ['Create a shopping list', 'Browse products', 'Get recommendations', 'View FAQs']
          };
        }
      }

      // Enhanced intent detection with better fallbacks
      if (this.containsKeywords(lowerMessage, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'])) {
        if (context.conversationCount > 1) {
          const personalizedGreetings = [
            `👋 Welcome back! I remember we've chatted ${context.conversationCount} times. Ready to continue your shopping journey?`,
            `🌟 Hi again! Great to see you back. I'm here to help with your shopping needs!`,
            `🛒 Hey there! Welcome back to SmartShopAI. What can I help you with today?`
          ];
          return {
            response: personalizedGreetings[Math.floor(Math.random() * personalizedGreetings.length)],
            suggestions: ['Create a shopping list', 'Browse products', 'View FAQs', 'Get recommendations']
          };
        } else {
          const firstTimeGreetings = [
            '👋 Hello! I\'m your SmartShopAI assistant. I\'m here to make your shopping experience amazing!',
            '🌟 Hi there! Welcome to SmartShopAI! I\'m your personal shopping companion.',
            '🛒 Hey! Welcome to SmartShopAI! I\'m here to help you shop smarter and more efficiently!'
          ];
          return {
            response: firstTimeGreetings[Math.floor(Math.random() * firstTimeGreetings.length)],
            suggestions: ['Create a shopping list', 'Browse products', 'View FAQs', 'Get help']
          };
        }
      }
      
      if (this.containsKeywords(lowerMessage, ['list', 'shopping list', 'create list', 'new list', 'add items'])) {
        const entities = this.extractProductEntities(message);
        
        if (entities.products.length > 0) {
          const productList = entities.products.join(', ');
          return {
            response: `📝 Great! I can help you with your shopping list. I noticed you mentioned: ${productList}. You can create a new list on the Shopping Lists page and add these items easily!`,
            suggestions: ['Create a new list', 'Add these items', 'Browse similar products', 'Get recommendations']
          };
        } else {
          return {
            response: '📝 To create a shopping list, go to the Shopping Lists page and click "New List". You can add items using natural language like "3 kg apples"!',
            suggestions: ['Show me products', 'How do I add items?', 'Create a new list']
          };
        }
      }
      
      if (this.containsKeywords(lowerMessage, ['product', 'catalog', 'browse', 'search', 'what products', 'items'])) {
        return {
          response: '🛍️ Browse our product catalog on the Products page! We have organic produce, dairy products, pantry items, and much more.',
          suggestions: ['View my orders', 'Get recommendations', 'Browse products']
        };
      }
      
      if (this.containsKeywords(lowerMessage, ['order', 'track', 'delivery', 'status', 'my orders', 'purchase'])) {
        return {
          response: '📦 You can view all your orders in the Orders section. Each order shows items, total amount, and current status.',
          suggestions: ['Create a new list', 'Browse products', 'View my orders']
        };
      }
      
      if (this.containsKeywords(lowerMessage, ['recommend', 'suggest', 'recommendation', 'what should i buy', 'personalized'])) {
        try {
          // Get personalized recommendations from the existing system
          const recommendations = await this.getPersonalizedRecommendations(userId);
          
          if (recommendations && recommendations.length > 0) {
            const productNames = recommendations.slice(0, 3).map(r => r.productName).join(', ');
            return {
              response: `🤖 Based on your shopping history, I recommend: ${productNames}. These are personalized suggestions just for you! Check the Products page for more details.`,
              suggestions: ['View all recommendations', 'Browse products', 'Create a shopping list', 'Get more suggestions']
            };
          } else {
            return {
              response: '🤖 Our AI analyzes your shopping history to provide personalized recommendations. Check the Products page to see suggestions!',
              suggestions: ['View recommendations', 'Browse products', 'Create a list']
            };
          }
        } catch (error) {
          console.error('[Chatbot Service] Error getting recommendations for response:', error);
          return {
            response: '🤖 Our AI analyzes your shopping history to provide personalized recommendations. Check the Products page to see suggestions!',
            suggestions: ['View recommendations', 'Browse products', 'Create a list']
          };
        }
      }
      
      if (this.containsKeywords(lowerMessage, ['help', 'how to', 'tutorial', 'guide', 'instructions', 'support'])) {
        return {
          response: '❓ I\'m here to help! You can create shopping lists, browse products, track orders, and get personalized recommendations. What would you like to know?',
          suggestions: ['Shopping lists', 'Products', 'Orders', 'Payments']
        };
      }
      
      if (this.containsKeywords(lowerMessage, ['joke', 'funny', 'laugh', 'humor'])) {
        const fallbackJokes = [
          '🛒 Why don\'t shopping carts ever get lonely? Because they always have a lot of items to carry around! 😄',
          '🥕 What do you call a fake noodle? An impasta! 🍝',
          '🍎 Why don\'t eggs tell jokes? They\'d crack each other up! 🥚'
        ];
        return {
          response: fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)],
          suggestions: ['Tell me another joke', 'Create a shopping list', 'Browse products']
        };
      }
      
      // Check for product entities in any message (this should already be handled earlier, but keeping as fallback)
      const entities = this.extractProductEntities(message);
      
      if (entities.products.length > 0) {
        const productList = entities.products.join(', ');
        const categoryInfo = entities.categories.length > 0 ? ` I also noticed you're interested in ${entities.categories.join(', ')} products.` : '';
        
        // Different responses based on context with more variety
        if (lowerMessage.includes('need') || lowerMessage.includes('want') || lowerMessage.includes('buy')) {
          // Update context to remember this shopping list offer
          this.updateUserContext(userId, message, 'shopping_list_offer');
          
          const responses = [
            `🛍️ Perfect! I can help you with ${productList}.${categoryInfo} You can add these items to a shopping list or browse them in our product catalog. Would you like me to help you create a shopping list?`,
            `🎯 Great choice! ${productList} are excellent items.${categoryInfo} I can help you organize these into a shopping list or show you similar products. What would you prefer?`,
            `✨ I see you need ${productList}!${categoryInfo} Let me help you get organized. Would you like to create a shopping list with these items or explore our product catalog?`,
            `🛒 Excellent! ${productList} are on your list.${categoryInfo} I can help you add these to a shopping list or find the best deals on these items. What would you like to do?`
          ];
          
          return {
            response: responses[Math.floor(Math.random() * responses.length)],
            suggestions: ['Create a shopping list', 'Add these items', 'Browse products', 'Get recommendations']
          };
        } else {
          const responses = [
            `🛍️ I noticed you mentioned ${productList}!${categoryInfo} These are great choices. I can help you add them to a shopping list or find similar products. What would you like to do?`,
            `🎉 ${productList} - nice selection!${categoryInfo} I can help you organize these items or show you related products. How can I assist you?`,
            `✨ Great taste! ${productList} are wonderful choices.${categoryInfo} Would you like me to help you add these to a shopping list or explore similar items?`,
            `🌟 I love that you mentioned ${productList}!${categoryInfo} These are fantastic items. I can help you create a shopping list or browse our catalog. What sounds good to you?`
          ];
          
          return {
            response: responses[Math.floor(Math.random() * responses.length)],
            suggestions: ['Create a shopping list', 'Add these items', 'Browse similar products', 'Get recommendations']
          };
        }
      }

      // Default enhanced response
      return {
        response: '🤖 I\'m your SmartShopAI assistant! While my advanced AI features are temporarily offline, I can help you with shopping lists, products, and orders. What would you like to do?',
        suggestions: ['Create a shopping list', 'Browse products', 'View FAQs', 'Get help']
      };
      
    } catch (error) {
      console.error('[Chatbot Service] Enhanced fallback failed:', error);
      // Ultimate fallback
      return {
        response: 'I\'m here to help with your shopping needs! Please try again or check our FAQ section.',
        suggestions: ['View FAQs', 'Get help']
      };
    }
  }

  /**
   * Get fallback response when Python chatbot is unavailable (legacy method)
   */
  private async getFallbackResponse(message: string): Promise<ChatbotResponse> {
    const lowerMessage = message.toLowerCase();

    // Intent-based fallback responses
    if (this.containsKeywords(lowerMessage, ['hello', 'hi', 'hey', 'good morning', 'good afternoon'])) {
      return {
        response: "💬 Hello! I'm your SmartShopAI assistant. How can I help you today?",
        suggestions: ["Create a shopping list", "Browse products", "Get recommendations", "Track my orders"]
      };
    }

    if (this.containsKeywords(lowerMessage, ['list', 'shopping list', 'create list', 'add items'])) {
      return {
        response: "📋 To create a shopping list, go to the Lists page and click 'New List'. You can add items manually or use natural language like '3 kg apples, 2 liters milk'.",
        suggestions: ["Add items with natural language", "View my lists", "Create a new list"]
      };
    }

    if (this.containsKeywords(lowerMessage, ['product', 'catalog', 'browse', 'search', 'what products'])) {
      return {
        response: "🛍️ You can browse our product catalog in the Products section. We have fresh groceries, dairy products, fruits, vegetables, and more!",
        suggestions: ["Search products", "Filter by category", "Add to shopping list"]
      };
    }

    if (this.containsKeywords(lowerMessage, ['order', 'track', 'delivery', 'status', 'my orders'])) {
      return {
        response: "📦 You can view all your orders in the Orders section. Track delivery status and view order details there.",
        suggestions: ["View order history", "Track current orders", "Check payment status"]
      };
    }

    if (this.containsKeywords(lowerMessage, ['recommend', 'suggest', 'recommendation', 'what should i buy'])) {
      return {
        response: "🤖 I can provide personalized recommendations based on your shopping history! Check the dashboard for AI-powered suggestions.",
        suggestions: ["Get personalized suggestions", "View trending products", "Find related items"]
      };
    }

    if (this.containsKeywords(lowerMessage, ['help', 'how to', 'tutorial', 'guide', 'instructions'])) {
      return {
        response: "❓ I'm here to help! You can create shopping lists, browse products, track orders, and get AI recommendations. What would you like to know more about?",
        suggestions: ["How to create lists", "Browse products", "Track orders", "Get recommendations"]
      };
    }

    if (this.containsKeywords(lowerMessage, ['bye', 'goodbye', 'thanks', 'thank you', 'see you'])) {
      return {
        response: "👋 Goodbye! Happy shopping with SmartShopAI!",
        suggestions: ["Happy shopping!", "See you next time!", "Thanks for using SmartShopAI!"]
      };
    }

    if (this.containsKeywords(lowerMessage, ['error', 'problem', 'not working', 'bug', 'issue'])) {
      return {
        response: "🔧 I'm sorry you're experiencing issues. Please try refreshing the page or contact support for technical problems.",
        suggestions: ["Try refreshing the page", "Contact support", "Check the FAQ"]
      };
    }

    // Default response
    return {
      response: "I understand you're asking about something. Let me help you with that! I can assist you with shopping lists, products, orders, recommendations, and more.",
      suggestions: ["How can I help you?", "Ask me about shopping lists", "Need product recommendations?", "Track my orders"]
    };
  }

  /**
   * Check if message contains any of the keywords
   */
  private containsKeywords(message: string, keywords: string[]): boolean {
    return keywords.some(keyword => message.includes(keyword));
  }

  /**
   * Update user context based on conversation
   */
  private updateUserContext(userId: string, message: string, intent: string): void {
    try {
      if (!this.userContext.has(userId)) {
        this.userContext.set(userId, {
          conversationCount: 0,
          lastSeen: new Date(),
          interests: [],
          preferences: {},
          lastIntent: null,
          lastUserMessage: null,
          lastBotMessage: null
        });
      }

      const context = this.userContext.get(userId);
      context.conversationCount += 1;
      context.lastSeen = new Date();
      context.lastIntent = intent;
      context.lastUserMessage = message;

      // Extract interests from message
      const lowerMessage = message.toLowerCase();
      const categories = ['dairy', 'produce', 'meat', 'bakery', 'frozen', 'pantry', 'organic'];
      const foundCategories = categories.filter(cat => lowerMessage.includes(cat));
      
      if (foundCategories.length > 0) {
        context.interests = Array.from(new Set([...context.interests, ...foundCategories]));
      }

      // Track preferences
      if (lowerMessage.includes('organic')) context.preferences.organic = true;
      if (lowerMessage.includes('budget')) context.preferences.budget = 'conscious';
      if (lowerMessage.includes('premium')) context.preferences.budget = 'premium';

      console.log(`[Chatbot Service] Updated context for user ${userId}:`, context);
    } catch (error) {
      console.error('[Chatbot Service] Error updating user context:', error);
    }
  }

  /**
   * Update bot message context
   */
  private updateBotMessageContext(userId: string, botMessage: string): void {
    try {
      if (!this.userContext.has(userId)) {
        this.updateUserContext(userId, '', '');
      }
      
      const context = this.userContext.get(userId);
      context.lastBotMessage = botMessage;
    } catch (error) {
      console.error('[Chatbot Service] Error updating bot message context:', error);
    }
  }

  /**
   * Get user context for personalized responses
   */
  private getUserContext(userId: string): any {
    return this.userContext.get(userId) || {
      conversationCount: 0,
      lastSeen: new Date(),
      interests: [],
      preferences: {},
      lastIntent: null,
      lastUserMessage: null,
      lastBotMessage: null
    };
  }

  /**
   * Extract product names and entities from user message
   */
  private extractProductEntities(message: string): { products: string[], quantities: string[], categories: string[] } {
    try {
      const lowerMessage = message.toLowerCase();
      
      // Common product categories
      const categories = ['dairy', 'produce', 'meat', 'bakery', 'frozen', 'pantry', 'organic', 'beverages'];
      
      // Common products
      const productKeywords = [
        'milk', 'bread', 'eggs', 'apples', 'bananas', 'chicken', 'beef', 'rice', 'pasta',
        'cheese', 'yogurt', 'butter', 'cereal', 'juice', 'water', 'coffee', 'tea',
        'tomatoes', 'potatoes', 'onions', 'carrots', 'lettuce', 'spinach', 'orange', 'grapes',
        'strawberries', 'blueberries', 'yogurt', 'ham', 'turkey', 'fish', 'salmon',
        'cookies', 'cake', 'chocolate', 'candy', 'nuts', 'almonds', 'walnuts',
        'oil', 'vinegar', 'salt', 'pepper', 'sugar', 'flour', 'honey', 'jam',
        'vegetables', 'vegetable', 'vegatables', 'fruits', 'fruit', 'meat', 'dairy', 'produce'
      ];
      
      // Quantity indicators
      const quantityKeywords = ['kg', 'lb', 'pound', 'liter', 'gallon', 'dozen', 'pack', 'bottle', 'can'];
      
      const foundProducts = productKeywords.filter(product => lowerMessage.includes(product));
      const foundCategories = categories.filter(cat => lowerMessage.includes(cat));
      const foundQuantities = quantityKeywords.filter(qty => lowerMessage.includes(qty));
      
      console.log('[Chatbot Service] Entity extraction for message:', message);
      console.log('[Chatbot Service] Found products:', foundProducts);
      console.log('[Chatbot Service] Found categories:', foundCategories);
      
      return {
        products: foundProducts,
        quantities: foundQuantities,
        categories: foundCategories
      };
      
    } catch (error) {
      console.error('[Chatbot Service] Error extracting entities:', error);
      return { products: [], quantities: [], categories: [] };
    }
  }

  /**
   * Get personalized recommendations for chatbot responses
   */
  private async getPersonalizedRecommendations(userId: string): Promise<any[]> {
    try {
      console.log('[Chatbot Service] Getting personalized recommendations for user:', userId);
      
      // Use the existing recommendation agent (read-only, safe integration)
      const recommendations = await recommendationAgent.getPersonalizedRecommendations(userId, 3);
      
      console.log(`[Chatbot Service] Found ${recommendations.products.length} recommendations`);
      return recommendations.products;
      
    } catch (error) {
      console.error('[Chatbot Service] Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const messages = await storage.getUserMessages(userId);
      return messages.map(msg => ({
        id: msg._id.toString(),
        content: msg.content,
        isBot: msg.isBot,
        timestamp: msg.timestamp
      }));
    } catch (error) {
      console.error('[Chatbot Service] Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * Check if Python chatbot is available
   */
  async checkPythonChatbotHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.pythonChatbotUrl}/health`, {
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      
      if (response.ok) {
        this.fallbackMode = false;
        return true;
      }
      
      this.fallbackMode = true;
      return false;
    } catch (error) {
      console.warn('[Chatbot Service] Python chatbot health check failed:', error);
      this.fallbackMode = true;
      return false;
    }
  }

  /**
   * Get chatbot status
   */
  getStatus(): { pythonChatbotAvailable: boolean; fallbackMode: boolean } {
    return {
      pythonChatbotAvailable: !this.fallbackMode,
      fallbackMode: this.fallbackMode
    };
  }

  /**
   * Reset fallback mode to try Python chatbot again
   */
  resetFallbackMode(): void {
    const wasInFallback = this.fallbackMode;
    this.fallbackMode = false;
    console.log(`[Chatbot Service] Fallback mode reset (was: ${wasInFallback}), will try Python chatbot again`);
    console.log(`[Chatbot Service] Python AI URL: ${this.pythonChatbotUrl}/api/chatbot/process`);
  }

  /**
   * Clear Python chatbot memory
   */
  async clearPythonChatbotMemory(): Promise<void> {
    try {
      console.log(`[Chatbot Service] Attempting to clear Python chatbot memory at: ${this.pythonChatbotUrl}/api/chatbot/messages`);
      
      const response = await fetch(`${this.pythonChatbotUrl}/api/chatbot/messages`, {
        method: 'DELETE'
      });
      
      console.log(`[Chatbot Service] Clear memory response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to clear Python chatbot memory: ${response.status} - ${errorText}`);
      }
      
      console.log('[Chatbot Service] Python chatbot memory cleared successfully');
    } catch (error) {
      console.warn('[Chatbot Service] Failed to clear Python chatbot memory:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const chatbotService = new ChatbotService();
