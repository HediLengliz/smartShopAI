# Smart Shopping List Application

## Overview
An intelligent shopping list management system with AI-powered features including natural language parsing, product recommendations, and chatbot support. Built with React, Express.js, PostgreSQL, and designed for easy AI agent integration.

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React with Vite, TypeScript, Tailwind CSS, Shadcn UI
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Theme**: Dark/Light mode support

### Backend (Express + PostgreSQL)
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **API Structure**: RESTful endpoints organized by team pairs

### Database Schema
Complete relational database with the following tables:
- **Users**: User accounts and authentication
- **Lists**: Shopping lists owned by users
- **ListItems**: Items within lists (with quantity, unit, status)
- **Products**: Product catalog with stock tracking
- **Orders**: User orders with status tracking
- **OrderItems**: Items within orders
- **Payments**: Payment records for orders
- **FAQ**: Frequently asked questions
- **Messages**: Chat messages for chatbot
- **Feedback**: User feedback with ratings
- **NLPLogs**: Logs of NLP parsing requests

## AI Agent Integration Points

The application is structured to support three AI agents as per your architecture:

### 1. NLP Agent (Pair 1)
- **Purpose**: Parse natural language input into structured shopping list items
- **Endpoints**: `/api/nlp/parse`
- **Integration**: See `server/routes.ts` - placeholder function `parseNaturalLanguage()`
- **Frontend**: List detail page has NLP input interface
- **Example**: "3 kg potatoes" → {name: "potatoes", quantity: 3, unit: "kg"}

### 2. Recommendation Agent (Pair 2)
- **Purpose**: Provide personalized product recommendations
- **Endpoints**: `/api/recommendations`
- **Integration**: Placeholder function `getRecommendations()`
- **Frontend**: Products page displays recommendations
- **Logic**: You can implement collaborative filtering or rule-based recommendations

### 3. Chatbot Agent (Pair 3)
- **Purpose**: Interactive customer support
- **Endpoints**: `/api/chatbot/send`
- **Integration**: Placeholder function `processChatbotMessage()`
- **Frontend**: Support page has chat interface
- **Logic**: You can integrate with any LLM API or custom chatbot logic

## API Endpoints (Organized by Team Pairs)

### Pair 1: NLP Agent + Lists
- `GET /api/lists` - Get all lists for user
- `POST /api/lists` - Create new list
- `GET /api/lists/:id` - Get specific list
- `DELETE /api/lists/:id` - Delete list
- `GET /api/lists/:id/items` - Get list items
- `POST /api/lists/:id/items` - Add item to list
- `PATCH /api/lists/:id/items/:itemId` - Update item status
- `DELETE /api/lists/:id/items/:itemId` - Remove item
- `POST /api/nlp/parse` - **AI Integration Point** - Parse natural language

### Pair 2: Recommendation Agent + Orders
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (admin)
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/recommendations` - **AI Integration Point** - Get personalized recommendations

### Pair 3: Chatbot + Support
- `GET /api/faq` - Get FAQs
- `POST /api/faq` - Create FAQ (admin)
- `POST /api/chatbot/send` - **AI Integration Point** - Send message to chatbot
- `GET /api/chatbot/messages` - Get chat history
- `POST /api/feedback` - Submit user feedback
- `POST /api/payments` - Process payment

## Project Structure

```
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # Shadcn components
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── dashboard.tsx
│   │   │   ├── lists-page.tsx
│   │   │   ├── list-detail.tsx
│   │   │   ├── products-page.tsx
│   │   │   ├── orders-page.tsx
│   │   │   └── support-page.tsx
│   │   ├── lib/             # Utilities
│   │   ├── App.tsx          # Main app component
│   │   └── index.css        # Global styles
├── server/                   # Backend Express application
│   ├── db.ts                # Database connection
│   ├── storage.ts           # Data access layer
│   └── routes.ts            # API endpoints
├── shared/                   # Shared TypeScript types
│   └── schema.ts            # Database schema & types
└── design_guidelines.md      # UI/UX design specifications
```

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (configured automatically in Replit)

### Installation
Dependencies are already installed. The project uses:
- React + Vite for frontend
- Express.js for backend
- Drizzle ORM for database
- Shadcn UI for components

### Running the Application
1. Start the development server: `npm run dev`
2. The app will be available at the configured port
3. Backend API runs on the same server (configured in `server/vite.ts`)

### Database Setup
1. Database is already provisioned (PostgreSQL via Neon)
2. Push schema to database: `npm run db:push`
3. Schema is defined in `shared/schema.ts`

## Development Workflow

### Adding New Features
1. Define data models in `shared/schema.ts`
2. Update storage interface in `server/storage.ts`
3. Add API endpoints in `server/routes.ts`
4. Create/update React components in `client/src/pages/`
5. Run `npm run db:push` if schema changed

### Implementing AI Agents

#### NLP Agent Example
```typescript
// In server/routes.ts - Replace placeholder
async function parseNaturalLanguage(text: string): Promise<NLPParseResult> {
  // Your AI logic here - call spaCy, OpenAI, etc.
  // Example: Use OpenAI API to extract entities
  const response = await openai.chat.completions.create({...});
  return {
    items: [...],
    confidence: 0.95
  };
}
```

#### Recommendation Agent Example
```typescript
// In server/routes.ts - Replace placeholder
async function getRecommendations(userId: string): Promise<RecommendationResult> {
  // Your recommendation logic
  // Could be collaborative filtering, rule-based, or ML model
  return {
    products: [...]
  };
}
```

#### Chatbot Agent Example
```typescript
// In server/routes.ts - Replace placeholder
async function processChatbotMessage(req: ChatbotRequest): Promise<ChatbotResponse> {
  // Your chatbot logic - call LLM API
  const response = await anthropic.messages.create({...});
  return {
    response: "...",
    suggestions: [...]
  };
}
```

## Design System
See `design_guidelines.md` for complete design specifications including:
- Color palette (light/dark modes)
- Typography scale
- Component usage guidelines
- Spacing and layout rules
- Interactive states

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - Component library
- **TanStack Query** - Data fetching & caching
- **Wouter** - Lightweight routing
- **Lucide React** - Icon library

### Backend
- **Express.js** - Web framework
- **Drizzle ORM** - Type-safe database access
- **PostgreSQL** - Relational database
- **Zod** - Schema validation
- **Neon Serverless** - PostgreSQL driver

## Environment Variables
All environment variables are automatically configured:
- `DATABASE_URL` - PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - PostgreSQL credentials

## Next Steps for AI Integration
1. **NLP Agent**: Integrate spaCy, Hugging Face, or OpenAI for parsing
2. **Recommendation Agent**: Implement collaborative filtering or use ML library
3. **Chatbot Agent**: Connect to LLM API (OpenAI, Anthropic, etc.)
4. Add API keys via Replit Secrets or environment variables
5. Replace placeholder functions in `server/routes.ts` with your implementations

## User Guide

### Creating Lists
1. Navigate to "Shopping Lists"
2. Click "New List" and enter a title
3. Use AI-powered parsing: Type "3 kg apples, 2 liters milk"
4. Or add items manually with quantity and unit

### Managing Items
- Mark items as urgent, pending, or purchased
- Delete items you no longer need
- Items automatically organize by status

### Browsing Products
- Search and filter product catalog
- View AI recommendations based on your history
- Add products directly to your shopping lists

### Placing Orders
- Create orders from your shopping lists
- View order history and status
- Track payments

### Getting Support
- Use AI chatbot for instant help
- Browse FAQs
- Submit feedback with ratings

## Notes
- All AI agent endpoints return placeholder data currently
- Frontend is fully functional and ready for backend integration
- Database schema supports all planned features
- Design follows modern productivity app patterns (Notion, Linear, Todoist)
