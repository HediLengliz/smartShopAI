# IntelliCart - Smart Shopping List Application

A full-stack intelligent shopping list application powered by AI. IntelliCart helps users create, manage, and optimize their shopping experience with natural language processing, personalized recommendations, and an AI-powered chatbot.

## 🌟 Features

### Core Features
- **Smart Shopping Lists**: Create and manage multiple shopping lists
- **Natural Language Processing**: Add items using natural language (e.g., "3 kg apples, 2 liters milk")
- **Product Catalog**: Browse and search through a comprehensive product catalog
- **Order Management**: Track orders, view history, and manage payments
- **AI-Powered Recommendations**: Get personalized product suggestions based on shopping history
- **Intelligent Chatbot**: Get help and support through an AI-powered assistant
- **Multi-Device Sync**: Access your lists from any device (via MongoDB)

### AI Features
1. **NLP Agent**: Parses natural language input into structured shopping items
2. **Recommendation Engine**: Provides personalized product recommendations
3. **Conversational Chatbot**: Assists users with FAQ and navigation

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Wouter** - Routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **TypeScript** - Type safety

### Development Tools
- **Vite** - Build tool and dev server
- **ESBuild** - Fast JavaScript bundler
- **TSX** - TypeScript execution

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
  - Alternative: Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free cloud database)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd IntelliCart
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
# Windows
copy .env.development .env

# Linux/Mac
cp .env.development .env
```

Or manually create a `.env` file with the following configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/intellicart

# Server
PORT=5000
NODE_ENV=development

# Session
SESSION_SECRET=your-secret-key-change-in-production

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_NLP_PARSING=true
ENABLE_RECOMMENDATIONS=true
ENABLE_CHATBOT=true
MOCK_AI_RESPONSES=true

# Development
DEBUG=true
ENABLE_REQUEST_LOGGING=true
```

### 4. Start MongoDB

**Option A: Local MongoDB**
```bash
# Windows (if installed as service)
net start MongoDB

# Linux
sudo systemctl start mongod

# Mac
brew services start mongodb-community
```

**Option B: MongoDB Atlas (Cloud)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in your `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/intellicart
   ```

### 5. Seed the Database (Optional but Recommended)

Populate the database with sample data:

```bash
npm run db:seed
```

This will create:
- 1 demo user
- 20 sample products
- 2 shopping lists with items
- 2 orders with payments
- 10 FAQs
- Sample chat messages

## 🎯 Running the Application

### Development Mode

**Windows:**
```bash
npm run dev:win
```

**Linux/Mac:**
```bash
npm run dev
```

The application will start on **http://localhost:5000**

### Production Build

```bash
# Build the application
npm run build

# Start production server (Windows)
npm run start:win

# Start production server (Linux/Mac)
npm run start
```

## 🔧 Quick Start Script (Windows)

For an easy setup, use the provided startup script:

```bash
start-dev.bat
```

This script will:
- Check if Node.js is installed
- Create `.env` file if missing
- Install dependencies if needed
- Optionally seed the database
- Start the development server

## 📁 Project Structure

```
IntelliCart/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and helpers
│   │   └── main.tsx          # Entry point
│   └── index.html
├── server/                    # Backend Express application
│   ├── models/               # Mongoose models
│   │   └── index.ts          # All database models
│   ├── services/             # Business logic services
│   │   └── ai-agents.ts      # AI agent implementations
│   ├── db.ts                 # Database connection
│   ├── index.ts              # Server entry point
│   ├── routes.ts             # API routes
│   ├── storage.ts            # Data access layer
│   └── seed.ts               # Database seeding script
├── shared/                    # Shared types and schemas
│   └── schema.ts             # TypeScript interfaces and Zod schemas
├── .env                       # Environment variables (create this)
├── .env.development          # Development environment template
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── tailwind.config.ts        # Tailwind CSS configuration
```

## 🔌 API Endpoints

### Lists
- `GET /api/lists` - Get all lists
- `POST /api/lists` - Create new list
- `GET /api/lists/:id` - Get specific list
- `DELETE /api/lists/:id` - Delete list
- `GET /api/lists/:id/items` - Get list items
- `POST /api/lists/:id/items` - Add item to list
- `POST /api/lists/:id/items/from-product` - Add product to list
- `PATCH /api/lists/:id/items/:itemId` - Update item status
- `DELETE /api/lists/:id/items/:itemId` - Delete item

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (admin)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order

### AI Features
- `POST /api/nlp/parse` - Parse natural language text
- `GET /api/recommendations` - Get personalized recommendations
- `GET /api/recommendations/related/:productId` - Get related products
- `GET /api/recommendations/trending` - Get trending products
- `POST /api/chatbot/send` - Send message to chatbot
- `GET /api/chatbot/messages` - Get chat history

### Support
- `GET /api/faq` - Get all FAQs
- `POST /api/faq` - Create FAQ (admin)
- `POST /api/feedback` - Submit feedback

## 🤖 AI Integration

The application currently uses **mock implementations** for AI features. These are ready to be replaced with real AI services:

### NLP Agent (Natural Language Processing)
**Current**: Regex-based parsing
**Recommended Upgrades**:
- OpenAI GPT-4 API
- Hugging Face Transformers
- spaCy NLP library
- Google Cloud Natural Language API

**Implementation Location**: `server/services/ai-agents.ts` - `NLPAgent` class

### Recommendation Engine
**Current**: Simple frequency-based recommendations
**Recommended Upgrades**:
- Collaborative filtering (Surprise library)
- Content-based filtering
- TensorFlow.js for ML models
- Amazon Personalize
- Custom ML models

**Implementation Location**: `server/services/ai-agents.ts` - `RecommendationAgent` class

### Chatbot
**Current**: Rule-based FAQ matching
**Recommended Upgrades**:
- OpenAI ChatGPT API
- Anthropic Claude API
- Rasa framework
- Google Dialogflow
- Microsoft Bot Framework

**Implementation Location**: `server/services/ai-agents.ts` - `ChatbotAgent` class

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:27017`

**Solutions**:
1. Make sure MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Check if MongoDB is running
   tasklist | findstr mongod
   ```

2. Check your `MONGODB_URI` in `.env` file
3. Try connecting to MongoDB Atlas instead of local MongoDB

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solutions**:
1. Change the port in `.env`:
   ```env
   PORT=3000
   ```

2. Or kill the process using port 5000:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -i :5000
   kill -9 <PID>
   ```

### Module Not Found Errors

**Problem**: `Error: Cannot find module '@shared/schema'`

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Or on Windows
rmdir /s /q node_modules
npm install
```

### TypeScript Compilation Errors

**Problem**: Various TypeScript errors

**Solution**:
```bash
# Run TypeScript check
npm run check

# If errors persist, try cleaning the build
rm -rf dist
npm run build
```

### Database Seed Fails

**Problem**: Error when running `npm run db:seed`

**Solutions**:
1. Make sure MongoDB is running
2. Check your `MONGODB_URI` connection string
3. Ensure you have write permissions to the database
4. Try dropping the database and seeding again:
   ```bash
   # In MongoDB shell
   use intellicart
   db.dropDatabase()
   
   # Then run seed again
   npm run db:seed
   ```

## 📊 Database Models

### User
- name, email, createdAt

### List
- userId, title, createdAt

### ListItem
- listId, productId, name, quantity, unit, status (pending/urgent/purchased)

### Product
- name, description, price, stock, stockAlertThreshold, category, imageUrl

### Order
- userId, status (pending/processing/completed/cancelled), totalAmount

### OrderItem
- orderId, productId, quantity, priceAtPurchase

### Payment
- orderId, amount, status, paymentMethod

### FAQ
- question, answer, category

### Message
- userId, content, isBot, timestamp

### Feedback
- userId, content, rating

### NlpLog
- userId, inputText, parsedData, timestamp

## 🔐 Security Notes

For production deployment:
1. Change `SESSION_SECRET` to a strong random string
2. Use environment variables for sensitive data
3. Enable CORS restrictions
4. Implement proper authentication
5. Add rate limiting
6. Use HTTPS
7. Validate and sanitize all inputs
8. Keep dependencies updated

## 🚢 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=<your-production-mongodb-uri>
PORT=5000
SESSION_SECRET=<strong-random-string>
ENABLE_AI_FEATURES=true
MOCK_AI_RESPONSES=false
```

### Recommended Platforms
- **Heroku**: Easy deployment with MongoDB Atlas
- **Railway**: Modern deployment platform
- **DigitalOcean App Platform**: Scalable hosting
- **AWS/Azure/GCP**: Full control and scalability
- **Vercel/Netlify**: For static frontend (with separate API backend)

## 📝 Development Scripts

```bash
# Development
npm run dev          # Start dev server (Linux/Mac)
npm run dev:win      # Start dev server (Windows)

# Production
npm run build        # Build for production
npm run start        # Start production server (Linux/Mac)
npm run start:win    # Start production server (Windows)

# Database
npm run db:seed      # Seed database with sample data

# Type Checking
npm run check        # Run TypeScript type checking
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the attached documentation in `attached_assets/`
3. Check if MongoDB is running and accessible
4. Ensure all environment variables are properly set
5. Look at the server logs for detailed error messages

## 🎓 Learning Resources

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Mongoose Docs](https://mongoosejs.com/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Built with ❤️ for smarter shopping**