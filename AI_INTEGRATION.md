# AI Integration Guide for IntelliCart

This guide explains how to integrate real AI services into the IntelliCart application. The current implementation uses mock responses, and this document shows you how to replace them with actual AI services.

## Table of Contents

1. [Overview](#overview)
2. [NLP Agent Integration](#nlp-agent-integration)
3. [Recommendation Agent Integration](#recommendation-agent-integration)
4. [Chatbot Agent Integration](#chatbot-agent-integration)
5. [Environment Setup](#environment-setup)
6. [Testing AI Components](#testing-ai-components)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting](#troubleshooting)

## Overview

The IntelliCart application has three AI agents that are currently implemented with mock responses:

- **NLP Agent**: Parses natural language shopping lists
- **Recommendation Agent**: Provides personalized product suggestions
- **Chatbot Agent**: Handles customer support conversations

All agents are located in `server/services/ai-agents.ts` and are ready for real AI integration.

## NLP Agent Integration

### Current Implementation
- **File**: `server/services/ai-agents.ts` - `NLPAgent` class
- **Method**: `parseNaturalLanguage(text: string, userId: string)`
- **Purpose**: Parse text like "3 kg apples, 2 liters milk" into structured items

### Integration Options

#### Option 1: OpenAI GPT Integration
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async parseNaturalLanguage(text: string, userId: string): Promise<NLPParseResult> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a shopping list parser. Extract items with quantities and units from natural language text. Return JSON format: {items: [{name: string, quantity: number, unit: string}], confidence: number}"
      },
      {
        role: "user",
        content: text
      }
    ],
    temperature: 0.1,
  });

  const result = JSON.parse(completion.choices[0].message.content);
  return result;
}
```

#### Option 2: spaCy Integration
```typescript
import { spacy } from 'spacy-js';

async parseNaturalLanguage(text: string, userId: string): Promise<NLPParseResult> {
  const nlp = await spacy.load("en_core_web_sm");
  const doc = await nlp(text);
  
  const items = [];
  for (const ent of doc.ents) {
    if (ent.label_ === "QUANTITY" || ent.label_ === "PRODUCT") {
      items.push({
        name: ent.text,
        quantity: parseFloat(ent.text) || 1,
        unit: "units"
      });
    }
  }
  
  return { items, confidence: 0.9 };
}
```

#### Option 3: Hugging Face Transformers
```typescript
import { pipeline } from '@huggingface/transformers';

async parseNaturalLanguage(text: string, userId: string): Promise<NLPParseResult> {
  const ner = await pipeline('ner', 'dbmdz/bert-large-cased-finetuned-conll03-english');
  const results = await ner(text);
  
  // Process NER results to extract shopping items
  const items = processNERResults(results);
  
  return { items, confidence: 0.8 };
}
```

### Testing NLP Agent
```bash
# Test the NLP endpoint
curl -X POST http://localhost:5000/api/nlp/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "3 kg apples, 2 liters milk, 1 loaf bread"}'
```

## Recommendation Agent Integration

### Current Implementation
- **File**: `server/services/ai-agents.ts` - `RecommendationAgent` class
- **Methods**: 
  - `getPersonalizedRecommendations(userId: string, limit: number)`
  - `getRelatedProducts(productId: string, limit: number)`
  - `getTrendingProducts(limit: number)`

### Integration Options

#### Option 1: Collaborative Filtering with Surprise
```typescript
import { Dataset, SVD } from 'surprise';

async getPersonalizedRecommendations(userId: string, limit: number): Promise<RecommendationResult> {
  // Load user purchase history
  const orders = await storage.getUserOrders(userId);
  const orderItems = await Promise.all(
    orders.map(order => storage.getOrderItems(order.id))
  );
  
  // Build user-item matrix
  const data = buildUserItemMatrix(orderItems);
  const dataset = Dataset.loadFromArray(data);
  
  // Train SVD model
  const algo = new SVD();
  const trainset = dataset.build_full_trainset();
  algo.fit(trainset);
  
  // Get recommendations
  const recommendations = [];
  const allProducts = await storage.getAllProducts();
  
  for (const product of allProducts) {
    const prediction = algo.predict(userId, product.id);
    if (prediction.est > 3.0) { // Threshold for recommendations
      recommendations.push({
        productId: product.id,
        productName: product.name,
        reason: "Based on your shopping patterns",
        confidence: prediction.est / 5.0
      });
    }
  }
  
  return { products: recommendations.slice(0, limit) };
}
```

#### Option 2: Content-Based Filtering
```typescript
import { TfidfVectorizer } from 'scikit-learn';

async getPersonalizedRecommendations(userId: string, limit: number): Promise<RecommendationResult> {
  // Get user's purchase history
  const orders = await storage.getUserOrders(userId);
  const purchasedProducts = await getPurchasedProducts(orders);
  
  // Build product features matrix
  const products = await storage.getAllProducts();
  const features = products.map(p => ({
    id: p.id,
    category: p.category,
    price: p.price,
    description: p.description
  }));
  
  // Calculate similarity scores
  const recommendations = calculateContentSimilarity(purchasedProducts, features);
  
  return { products: recommendations.slice(0, limit) };
}
```

#### Option 3: External Recommendation API
```typescript
async getPersonalizedRecommendations(userId: string, limit: number): Promise<RecommendationResult> {
  const response = await fetch('https://api.recommendation-service.com/recommend', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RECOMMENDATION_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      limit,
      algorithm: 'collaborative_filtering'
    })
  });
  
  const data = await response.json();
  return data;
}
```

### Testing Recommendation Agent
```bash
# Test recommendations endpoint
curl http://localhost:5000/api/recommendations?limit=5

# Test related products
curl http://localhost:5000/api/recommendations/related/PRODUCT_ID?limit=3

# Test trending products
curl http://localhost:5000/api/recommendations/trending?limit=4
```

## Chatbot Agent Integration

### Current Implementation
- **File**: `server/services/ai-agents.ts` - `ChatbotAgent` class
- **Method**: `processMessage(userId: string, message: string, history?: Array)`

### Integration Options

#### Option 1: OpenAI GPT Integration
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async processMessage(userId: string, message: string, history?: Array): Promise<ChatbotResponse> {
  const messages = [
    {
      role: "system",
      content: "You are a helpful shopping assistant for IntelliCart. Help users with shopping lists, products, orders, and payments. Be friendly and concise."
    },
    ...(history || []),
    {
      role: "user",
      content: message
    }
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
    temperature: 0.7,
    max_tokens: 500
  });

  const response = completion.choices[0].message.content;
  
  // Generate suggestions based on context
  const suggestions = await this.generateSuggestions(response);
  
  return { response, suggestions };
}
```

#### Option 2: Anthropic Claude Integration
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async processMessage(userId: string, message: string, history?: Array): Promise<ChatbotResponse> {
  const conversation = history ? history.map(h => `${h.role}: ${h.content}`).join('\n') : '';
  
  const response = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Context: ${conversation}\n\nUser: ${message}\n\nRespond as a helpful shopping assistant.`
      }
    ]
  });

  return {
    response: response.content[0].text,
    suggestions: ["How can I help you further?", "Browse products", "Create a list"]
  };
}
```

#### Option 3: Rasa Framework Integration
```typescript
async processMessage(userId: string, message: string, history?: Array): Promise<ChatbotResponse> {
  const response = await fetch(`${process.env.RASA_SERVER_URL}/webhooks/rest/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: userId,
      message: message
    })
  });

  const data = await response.json();
  
  return {
    response: data[0]?.text || "I'm sorry, I didn't understand that.",
    suggestions: data[0]?.quick_replies || []
  };
}
```

### Testing Chatbot Agent
```bash
# Test chatbot endpoint
curl -X POST http://localhost:5000/api/chatbot/send \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I create a shopping list?"}'

# Get chat history
curl http://localhost:5000/api/chatbot/messages
```

## Environment Setup

### 1. Install Required Dependencies

```bash
# For OpenAI integration
npm install openai

# For spaCy integration
npm install spacy-js

# For Hugging Face integration
npm install @huggingface/transformers

# For collaborative filtering
npm install surprise

# For scikit-learn (Node.js)
npm install scikit-learn

# For Anthropic Claude
npm install @anthropic-ai/sdk
```

### 2. Environment Variables

Add these to your `.env` file:

```env
# AI Service Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_NLP_PARSING=true
ENABLE_RECOMMENDATIONS=true
ENABLE_CHATBOT=true

# Development
MOCK_AI_RESPONSES=false
```

### 3. Update Package.json Scripts

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "db:seed": "tsx server/seed.ts",
    "test:ai": "tsx server/tests/ai-agents.test.ts"
  }
}
```

## Testing AI Components

### 1. Unit Tests for AI Agents

Create `server/tests/ai-agents.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { nlpAgent, recommendationAgent, chatbotAgent } from '../services/ai-agents';

describe('AI Agents', () => {
  describe('NLP Agent', () => {
    it('should parse natural language text', async () => {
      const result = await nlpAgent.parseNaturalLanguage('3 kg apples, 2 liters milk', 'user123');
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('apples');
      expect(result.items[0].quantity).toBe(3);
      expect(result.items[0].unit).toBe('kg');
    });
  });

  describe('Recommendation Agent', () => {
    it('should get personalized recommendations', async () => {
      const result = await recommendationAgent.getPersonalizedRecommendations('user123', 5);
      expect(result.products).toHaveLength(5);
      expect(result.products[0]).toHaveProperty('productId');
      expect(result.products[0]).toHaveProperty('confidence');
    });
  });

  describe('Chatbot Agent', () => {
    it('should process user messages', async () => {
      const result = await chatbotAgent.processMessage('user123', 'How do I create a list?');
      expect(result.response).toBeDefined();
      expect(typeof result.response).toBe('string');
    });
  });
});
```

### 2. Integration Tests

```typescript
// Test API endpoints
describe('AI API Endpoints', () => {
  it('should parse NLP text via API', async () => {
    const response = await fetch('http://localhost:5000/api/nlp/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '3 kg apples' })
    });
    
    const data = await response.json();
    expect(data.items).toBeDefined();
  });
});
```

## Performance Considerations

### 1. Caching
```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

async getPersonalizedRecommendations(userId: string, limit: number): Promise<RecommendationResult> {
  const cacheKey = `recommendations_${userId}_${limit}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const result = await this.generateRecommendations(userId, limit);
  cache.set(cacheKey, result);
  return result;
}
```

### 2. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many AI requests, please try again later.'
});

app.use('/api/nlp', aiRateLimit);
app.use('/api/recommendations', aiRateLimit);
app.use('/api/chatbot', aiRateLimit);
```

### 3. Async Processing
```typescript
import { Queue } from 'bull';

const aiQueue = new Queue('AI processing');

// Add NLP processing to queue
aiQueue.add('parse-text', { text, userId });

// Process queue
aiQueue.process('parse-text', async (job) => {
  const { text, userId } = job.data;
  return await nlpAgent.parseNaturalLanguage(text, userId);
});
```

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify API key is correct
   - Check API key permissions
   - Ensure sufficient credits/quota

2. **Slow Response Times**
   - Implement caching
   - Use async processing
   - Consider model size vs. speed trade-offs

3. **Memory Issues**
   - Use streaming for large models
   - Implement model cleanup
   - Monitor memory usage

4. **Rate Limiting**
   - Implement exponential backoff
   - Use multiple API keys
   - Cache responses

### Debug Mode

Enable debug logging:

```typescript
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('[AI Agent] Processing request:', { text, userId });
  console.log('[AI Agent] Response:', result);
}
```

### Monitoring

```typescript
// Add metrics collection
import { Counter, Histogram } from 'prom-client';

const aiRequestCounter = new Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['agent', 'status']
});

const aiResponseTime = new Histogram({
  name: 'ai_response_time_seconds',
  help: 'AI response time in seconds',
  labelNames: ['agent']
});
```

## Next Steps

1. Choose your AI service providers
2. Set up API keys and environment variables
3. Implement one agent at a time
4. Test thoroughly with real data
5. Monitor performance and costs
6. Optimize based on usage patterns

For questions or issues, refer to the individual service documentation or create an issue in the project repository.

