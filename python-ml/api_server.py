"""
IntelliCart ML Recommendation API Server
Flask API for serving ML-based recommendations
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from datetime import datetime
import logging
from typing import Dict, List, Optional
import json
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.naive_bayes import MultinomialNB
import pickle
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Fuzzy string matching for spell correction
from fuzzywuzzy import fuzz, process

# MongoDB
from pymongo import MongoClient
from dotenv import load_dotenv

# Import recommendation engine
from recommendation_model import RecommendationEngine

# Load environment variables from parent directory
load_dotenv('../.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# AI-Powered Chatbot Class
class AIChatbot:
    def __init__(self):
        # Initialize AI components
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.intent_classifier = None
        self.context_memory = {}
        self.conversation_history = {}
        
        # Initialize MongoDB connection
        self.mongo_client = None
        self.db = None
        self._connect_to_database()
        
        # Initialize spell correction
        self.vocabulary = self._build_vocabulary()
        
        # Initialize NLP components
        try:
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            nltk.download('wordnet', quiet=True)
            self.lemmatizer = WordNetLemmatizer()
            self.stop_words = set(stopwords.words('english'))
        except Exception as e:
            logger.warning(f"NLTK setup failed: {e}")
            self.lemmatizer = None
            self.stop_words = set()
        
        # Training data for intent classification
        self.training_data = self._get_training_data()
        self._train_intent_classifier()
        
        # Fallback responses
        self.responses = {
            'greeting': [
                '👋 Hey there! Welcome to SmartShopAI! I\'m your personal shopping assistant. What brings you here today?',
                '🎉 Hello! Great to see you! I\'m here to make your shopping experience amazing. What can I help you discover?',
                '🌟 Hi! Ready to revolutionize your shopping? I\'ve got some fantastic features to show you!',
                '💫 Welcome back! I\'ve been working on some cool new recommendations. Want to check them out?',
                '🚀 Hey! Your shopping journey starts here! What are you looking to accomplish today?',
                '🛒 Hello! I\'m your AI shopping buddy! Ready to make your grocery runs smarter and more fun?',
                '🌟 Welcome to the future of shopping! I\'m here to help you discover, organize, and optimize your shopping experience!',
                '🎯 Hi there! Your personal shopping assistant is ready to help. What can we tackle together today?',
                '✨ Hey! I\'m powered by advanced AI to make your shopping experience seamless and enjoyable!',
                '🛍️ Hello! Ready to transform your shopping routine? I\'m here to guide you every step of the way!',
                '🤖 Greetings! I\'m your intelligent shopping companion, here to help you shop smarter, not harder!'
            ],
            'shopping_lists': [
                '📝 Let\'s create your perfect shopping list! Head to the Lists page and hit "New List" - it\'s super intuitive!',
                '🛒 Ready to make shopping effortless? Create a new list and watch the magic happen with our AI-powered suggestions!',
                '✨ Building lists just got exciting! Click "New List" and try adding items naturally - like "2kg fresh tomatoes, organic milk" - I\'ll parse it instantly!',
                '🎯 Time to get organized! New lists are just a click away, and you can even use voice commands for a hands-free experience!',
                '📋 Let\'s build something amazing together! Create your list and I\'ll help you find the best deals and alternatives.'
            ],
            'products': [
                '🛍️ Our product catalog is absolutely stunning! Fresh organic produce, premium dairy, and exclusive items await you in the Products section!',
                '🌟 Discover our curated selection! From farm-fresh vegetables to artisanal cheeses - every product is carefully chosen for quality!',
                '✨ Ready for a shopping adventure? Browse our catalog and let our AI surprise you with personalized recommendations!',
                '🎉 We\'ve got everything you need and more! Check out our seasonal specials and trending products in the catalog!',
                '🔥 Our product collection keeps growing! Explore categories, read reviews, and find your new favorites!'
            ],
            'orders': [
                '📦 Your orders are like treasure maps! Track them in real-time in the Orders section - from packing to your doorstep!',
                '🚚 Excited to see where your order is? Check the Orders page for live updates and estimated delivery times!',
                '📍 Your packages are on an adventure! Follow their journey with detailed tracking and delivery notifications!',
                '🎁 Good news travels fast! Monitor your orders and get instant updates on any changes or delays!',
                '⚡ Stay in the loop! Your Orders page shows everything - from confirmation to delivery confirmation!'
            ],
            'recommendations': [
                '🤖 Oh, you\'re going to love this! I\'ve analyzed your shopping patterns and found some incredible personalized recommendations just for you!',
                '💎 I\'ve been working on something special! Check out these AI-curated suggestions based on your unique preferences!',
                '🎯 Perfect timing! I\'ve discovered some products that match your taste perfectly. Want to see what I found?',
                '✨ Your personal shopping genie is here! I\'ve prepared some amazing recommendations that I think you\'ll absolutely love!',
                '🌟 This is where the magic happens! Let me show you some trending items and hidden gems based on your shopping history!'
            ],
            'weather': [
                '🌤️ I\'m focused on shopping, but I can help you find seasonal products! Looking for summer essentials or cozy winter items?',
                '🛍️ Weather affects shopping too! Need rain gear, sunscreen, or seasonal foods? I\'ve got you covered!',
                '☀️ While I can\'t predict weather, I can suggest weather-appropriate products! What season are you shopping for?',
                '🌦️ Let\'s talk shopping instead! I can help you find products perfect for any weather condition!',
                '🌈 Weather or not, I\'m here for your shopping needs! Need seasonal recommendations?'
            ],
            'help': [
                '🎯 I\'m your shopping superhero! I can help you create lists, find products, track orders, and discover amazing recommendations!',
                '💡 Let\'s make shopping fun! I can guide you through creating lists, browsing products, and finding the best deals!',
                '🚀 Ready to transform your shopping? I\'ve got tools for lists, products, orders, and personalized suggestions!',
                '✨ I\'m here to make shopping effortless! Ask me about lists, products, orders, or recommendations - I\'ve got you covered!',
                '🎪 Welcome to the SmartShopAI experience! I can help with everything from list creation to product discovery!'
            ]
        }
    
    def get_response(self, message: str, user_id: str = 'default_user') -> dict:
        """Generate AI-powered response"""
        try:
            # Correct spelling errors in the message
            original_message = message
            corrected_message = self._correct_spelling(message)
            
            # Log spelling corrections
            if corrected_message != original_message:
                logger.info(f"Original: '{original_message}' -> Corrected: '{corrected_message}'")
                message = corrected_message  # Use corrected message for processing
            
            # Classify intent using AI
            intent, confidence = self._classify_intent(message)
            
            # Update user context
            self._update_user_context(user_id, message, intent)
            
            # Generate AI response
            ai_response = self._generate_ai_response(message, intent, user_id)
            
            # Get contextual suggestions
            suggestions = self._get_suggestions(intent)
            
            # Add AI-specific metadata
            response_data = {
                'response': ai_response,
                'intent': intent,
                'confidence': float(confidence),
                'suggestions': suggestions,
                'timestamp': datetime.now().isoformat(),
                'ai_powered': True,
                'context_aware': True
            }
            
            # Store conversation history
            self._store_conversation(user_id, message, ai_response, intent)
            
            return response_data
            
        except Exception as e:
            logger.error(f"AI response generation failed: {e}")
            # Fallback to static response
            return self._get_fallback_response_data(message)
    
    def _update_user_context(self, user_id: str, message: str, intent: str):
        """Update user context for personalized responses"""
        if user_id not in self.context_memory:
            self.context_memory[user_id] = {
                'is_returning': False,
                'preferences': [],
                'last_intent': None,
                'conversation_count': 0
            }
        
        context = self.context_memory[user_id]
        context['conversation_count'] += 1
        context['last_intent'] = intent
        
        if context['conversation_count'] > 1:
            context['is_returning'] = True
        
        # Extract preferences from message
        if intent == 'products':
            words = message.lower().split()
            for word in words:
                if word in ['organic', 'fresh', 'local', 'premium', 'cheap', 'expensive']:
                    if word not in context['preferences']:
                        context['preferences'].append(word)
    
    def _store_conversation(self, user_id: str, message: str, response: str, intent: str):
        """Store conversation history"""
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = []
        
        self.conversation_history[user_id].append({
            'timestamp': datetime.now().isoformat(),
            'user_message': message,
            'bot_response': response,
            'intent': intent
        })
        
        # Keep only last 10 conversations
        if len(self.conversation_history[user_id]) > 10:
            self.conversation_history[user_id] = self.conversation_history[user_id][-10:]
    
    def _get_fallback_response_data(self, message: str) -> dict:
        """Fallback response when AI fails"""
        message_lower = message.lower()
        
        # Simple keyword matching fallback
        if any(word in message_lower for word in ['hello', 'hi', 'hey']):
            intent = 'greeting'
        elif any(word in message_lower for word in ['list', 'shopping']):
            intent = 'shopping_lists'
        elif any(word in message_lower for word in ['product', 'catalog']):
            intent = 'products'
        else:
            intent = 'help'
        
        import random
        response = random.choice(self.responses.get(intent, self.responses['help']))
        
        return {
            'response': response,
            'intent': intent,
            'confidence': 0.5,
            'suggestions': self._get_suggestions(intent),
            'timestamp': datetime.now().isoformat(),
            'ai_powered': False,
            'context_aware': False
        }
    
    def _get_suggestions(self, intent: str) -> list:
        """Get contextual suggestions based on intent"""
        suggestions_map = {
            'greeting': ['Create a shopping list', 'Browse products', 'Get recommendations', 'Track my orders'],
            'shopping_lists': ['Add items with natural language', 'View my lists', 'Create a new list', 'Get suggestions'],
            'products': ['Search products', 'Filter by category', 'Add to shopping list', 'Get recommendations'],
            'orders': ['View order history', 'Track current orders', 'Check payment status', 'Create new list'],
            'recommendations': ['Get personalized suggestions', 'View trending products', 'Find related items', 'Browse catalog'],
            'weather': ['Find seasonal products', 'Browse summer items', 'Get winter essentials', 'Check specials'],
            'general': ['Tell me another joke', 'Create a shopping list', 'Browse products', 'Get recommendations'],
            'help': ['How to create lists', 'Browse products', 'Track orders', 'Get recommendations']
        }
        
        return suggestions_map.get(intent, ['How can I help you?', 'Ask me about shopping lists'])
    
    def _connect_to_database(self):
        """Connect to MongoDB database"""
        try:
            mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/intellicart')
            logger.info(f"MongoDB URI: {mongodb_uri}")
            self.mongo_client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
            # Test connection
            self.mongo_client.server_info()
            self.db = self.mongo_client['intellicart']
            logger.info("✓ Connected to MongoDB database")
        except Exception as e:
            logger.warning(f"MongoDB connection failed: {e}")
            self.mongo_client = None
            self.db = None
    
    def _get_products_from_db(self, category=None, max_price=None, limit=10):
        """Get products from database with optional filtering"""
        if self.db is None:
            logger.warning("Database connection is None, returning empty list")
            return []
        
        try:
            query = {}
            if category:
                query['category'] = {'$regex': category, '$options': 'i'}
            if max_price:
                query['price'] = {'$lte': float(max_price)}
            
            logger.info(f"Querying database with: {query}")
            products = list(self.db.products.find(query).limit(limit))
            logger.info(f"Found {len(products)} products from database")
            
            # Convert ObjectId to string for JSON serialization
            for product in products:
                product['_id'] = str(product['_id'])
            
            return products
        except Exception as e:
            logger.error(f"Error fetching products from database: {e}")
            return []
    
    def _format_product_recommendations(self, products, category_name=None, price_limit=None):
        """Format product recommendations for chatbot response"""
        if products is None or len(products) == 0:
            return "Sorry, I couldn't find any products matching your criteria."
        
        formatted_products = []
        for product in products[:4]:  # Show max 4 products
            name = product.get('name', 'Unknown Product')
            price = product.get('price', 0)
            formatted_products.append(f"{name} (${price:.2f})")
        
        if category_name and price_limit:
            return f"🥛 Here are {category_name.lower()} products under ${price_limit}: {', '.join(formatted_products)}. All perfect for your budget!"
        elif category_name:
            return f"🥗 Perfect! For {category_name.lower()}, I recommend: {', '.join(formatted_products)}. These are all great choices!"
        else:
            return f"🛍️ Here are some great products: {', '.join(formatted_products)}. Check them out!"
    
    def _build_vocabulary(self):
        """Build vocabulary from product names and common shopping terms"""
        vocabulary = set()
        
        # Common shopping terms
        shopping_terms = [
            'dairy', 'milk', 'cheese', 'butter', 'eggs', 'yogurt',
            'vegetables', 'tomatoes', 'carrots', 'onions', 'potatoes', 'spinach',
            'meat', 'chicken', 'beef', 'pork', 'protein',
            'fruits', 'apples', 'bananas', 'oranges',
            'bread', 'bakery', 'baked', 'pasta', 'rice', 'cereal',
            'beverages', 'drink', 'juice', 'coffee', 'tea',
            'pantry', 'cooking', 'kitchen', 'grocery',
            'shopping', 'list', 'cart', 'buy', 'purchase',
            'price', 'cheap', 'expensive', 'budget', 'under', 'over',
            'organic', 'fresh', 'frozen', 'canned'
        ]
        
        # Add product names from database if available
        if self.db is not None:
            try:
                products = self.db.products.find({}, {'name': 1})
                for product in products:
                    # Extract words from product names
                    name_words = product['name'].lower().split()
                    vocabulary.update(name_words)
            except Exception as e:
                logger.warning(f"Could not load product names for vocabulary: {e}")
        
        # Add common shopping terms
        vocabulary.update(shopping_terms)
        
        return list(vocabulary)
    
    def _correct_spelling(self, text):
        """Correct spelling errors in text using fuzzy matching"""
        if not text:
            return text
        
        words = text.lower().split()
        corrected_words = []
        
        for word in words:
            # Skip very short words or numbers
            if len(word) <= 2 or word.isdigit():
                corrected_words.append(word)
                continue
            
            # Find best match in vocabulary
            best_match = process.extractOne(word, self.vocabulary, scorer=fuzz.ratio)
            
            # Only correct if similarity is high enough (>= 70%)
            if best_match and best_match[1] >= 70:
                corrected_words.append(best_match[0])
                logger.info(f"Spell corrected: '{word}' -> '{best_match[0]}' (confidence: {best_match[1]}%)")
            else:
                corrected_words.append(word)
        
        corrected_text = ' '.join(corrected_words)
        return corrected_text
    
    def _get_training_data(self):
        """Get training data for intent classification"""
        return {
            'greeting': [
                'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
                'bonjour', 'salut', 'bonsoir', 'greetings', 'welcome', 'howdy'
            ],
            'shopping_lists': [
                'create a shopping list', 'make a new list', 'add items to list',
                'shopping list', 'grocery list', 'add items manually', 'new list',
                'create list', 'make list', 'shopping cart'
            ],
            'products': [
                'show me products', 'browse products', 'product catalog', 'items',
                'goods', 'catalog', 'show products', 'display items', 'product list'
            ],
            'orders': [
                'track my order', 'order status', 'delivery status', 'shipping status',
                'where is my order', 'order tracking', 'package status', 'order history'
            ],
            'recommendations': [
                'recommendations', 'suggestions', 'personalized recommendations',
                'recommend me', 'suggest products', 'what should I buy', 'recommend'
            ],
            'weather': [
                'weather', 'temperature', 'rain', 'sunny', 'cloudy', 'forecast',
                'weather today', 'climate', 'weather conditions', 'hows the weather',
                'how is the weather', 'what is the weather', 'weather report'
            ],
            'help': [
                'help', 'how to', 'what can you do', 'assistance', 'support',
                'guide me', 'instructions', 'tutorial'
            ]
        }
    
    def _train_intent_classifier(self):
        """Train the intent classification model"""
        try:
            # Prepare training data
            texts = []
            labels = []
            
            for intent, examples in self.training_data.items():
                for example in examples:
                    texts.append(self._preprocess_text(example))
                    labels.append(intent)
            
            # Vectorize texts
            X = self.vectorizer.fit_transform(texts)
            
            # Train classifier
            self.intent_classifier = MultinomialNB()
            self.intent_classifier.fit(X, labels)
            
            logger.info("Intent classifier trained successfully")
            
        except Exception as e:
            logger.error(f"Failed to train intent classifier: {e}")
            self.intent_classifier = None
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for AI processing"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters
        text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
        
        # Tokenize if lemmatizer is available
        if self.lemmatizer:
            try:
                tokens = word_tokenize(text)
                tokens = [self.lemmatizer.lemmatize(token) for token in tokens 
                         if token not in self.stop_words and len(token) > 2]
                text = ' '.join(tokens)
            except:
                pass
        
        return text
    
    def _classify_intent(self, message: str) -> tuple:
        """Classify user intent using AI"""
        try:
            # First try fallback classification for better accuracy
            fallback_intent, fallback_confidence = self._fallback_intent_classification(message)
            
            # If fallback found a good match, use it
            if fallback_confidence >= 0.8:
                return fallback_intent, fallback_confidence
            
            # Otherwise try the trained classifier
            if not self.intent_classifier:
                return fallback_intent, fallback_confidence
            
            # Preprocess message
            processed_text = self._preprocess_text(message)
            
            # Vectorize
            X = self.vectorizer.transform([processed_text])
            
            # Predict intent
            intent = self.intent_classifier.predict(X)[0]
            confidence = self.intent_classifier.predict_proba(X).max()
            
            # Only use classifier if confidence is high enough
            if confidence >= 0.7:
                return intent, confidence
            else:
                # Use fallback if classifier confidence is too low
                return fallback_intent, fallback_confidence
            
        except Exception as e:
            logger.error(f"Intent classification failed: {e}")
            return self._fallback_intent_classification(message)
    
    def _fallback_intent_classification(self, message: str) -> tuple:
        """Fallback intent classification using keyword matching"""
        # Use corrected spelling for better classification
        corrected_message = self._correct_spelling(message)
        message_lower = corrected_message.lower()
        
        # Enhanced keyword matching with better weather detection
        if any(word in message_lower for word in ['hello', 'hi', 'hey', 'bonjour', 'good morning', 'good afternoon', 'good evening']):
            return 'greeting', 0.8
        elif any(word in message_lower for word in ['list', 'shopping list', 'create list', 'new list', 'add items', 'manually']):
            return 'shopping_lists', 0.8
        elif any(word in message_lower for word in ['product', 'catalog', 'browse', 'show me', 'items', 'goods', 'vegetables', 'salad', 'pasta', 'dairy', 'milk', 'bread', 'apples', 'tomatoes', 'chicken', 'beef', 'eggs', 'meat', 'fruits', 'bakery', 'beverages', 'pantry']):
            return 'products', 0.8
        elif any(word in message_lower for word in ['order', 'track', 'status', 'delivery', 'package', 'shipping']):
            return 'orders', 0.8
        elif any(word in message_lower for word in ['recommend', 'suggestion', 'personalized', 'suggest']):
            return 'recommendations', 0.8
        elif any(word in message_lower for word in ['weather', 'temperature', 'rain', 'sunny', 'cloudy', 'hows the weather', 'how is the weather', 'forecast', 'climate']):
            return 'weather', 0.8
        elif any(word in message_lower for word in ['joke', 'funny', 'laugh', 'humor', 'tell me a joke', 'make me laugh']):
            return 'general', 0.8
        else:
            return 'help', 0.6
    
    def _generate_ai_response(self, message: str, intent: str, user_id: str) -> str:
        """Generate AI-powered response based on intent and context"""
        try:
            # Get user context
            context = self.context_memory.get(user_id, {})
            conversation = self.conversation_history.get(user_id, [])
            
            # Generate contextual response with AI-powered intelligence
            if intent == 'greeting':
                if context.get('is_returning', False):
                    return f"👋 Welcome back! I've been analyzing your shopping patterns and have some exciting new recommendations ready. What would you like to explore today?"
                else:
                    return f"🎉 Hello! I'm your advanced AI shopping assistant powered by machine learning. I can help you create smart lists, discover products, and provide personalized recommendations based on your preferences!"
            
            elif intent == 'shopping_lists':
                if 'list' in context:
                    return f"📝 I see you already have a shopping list! Based on your previous purchases, I can suggest some complementary items. Would you like me to analyze your list and add smart recommendations?"
                else:
                    return f"✨ Let's create your perfect shopping list using AI! I can parse natural language like '2kg organic apples, fresh milk, and gluten-free bread' and automatically categorize everything for you."
            
            elif intent == 'products':
                # Check for specific cooking scenarios
                message_lower = message.lower()
                
                if 'salad' in message_lower or 'vegetables' in message_lower:
                    # Get vegetable products from database
                    products = self._get_products_from_db(category='Vegetables', limit=4)
                    if products:
                        return self._format_product_recommendations(products, "vegetables")
                    else:
                        return f"🥗 Perfect! For a fresh salad, I recommend: Tomatoes ($2.49), Spinach ($2.99), Carrots ($2.29), and Onions ($1.99). These are all under $3 and perfect for salads!"
                
                elif 'pasta' in message_lower or 'italian' in message_lower:
                    # Get pasta-related products from database
                    pasta_products = self._get_products_from_db(category='Pantry', limit=2) # Pasta is in Pantry
                    tomato_products = self._get_products_from_db(category='Vegetables', limit=2) # Tomatoes are vegetables
                    all_products = pasta_products + tomato_products
                    if all_products:
                        return self._format_product_recommendations(all_products, "Italian pasta")
                    else:
                        return f"🍝 Great choice! For Italian pasta, you'll need: Pasta - Spaghetti ($1.99), Tomatoes ($2.49), Onions ($1.99), and Olive Oil. I can also suggest Parmesan cheese and garlic for authentic flavor!"
                
                elif 'dairy' in message_lower and ('under' in message_lower or '$' in message_lower):
                    # Extract price limit from message
                    price_match = re.search(r'\$?(\d+)', message_lower)
                    price_limit = int(price_match.group(1)) if price_match else 5
                    
                    # Get dairy products from database
                    products = self._get_products_from_db(category='Dairy', max_price=price_limit, limit=4)
                    logger.info(f"Dairy query returned {len(products)} products for price limit ${price_limit}")
                    if products:
                        response = self._format_product_recommendations(products, "dairy", price_limit)
                        logger.info(f"Using database response: {response[:50]}...")
                        return response
                    else:
                        logger.warning(f"No dairy products found under ${price_limit}, returning no results message")
                        return f"🥛 Sorry, I couldn't find any dairy products under ${price_limit}. The cheapest dairy products we have are: Butter ($4.29), Whole Milk ($4.49), Cheese ($4.79), and Eggs ($4.99)."
                
                elif context.get('preferences'):
                    return f"🛍️ Based on your AI-analyzed preferences for {', '.join(context['preferences'][:2])}, I've found some trending products that match your taste! Let me show you some personalized recommendations."
                else:
                    # Try to extract category and price from message for generic queries
                    # Extract price limit
                    price_match = re.search(r'\$?(\d+)', message_lower)
                    price_limit = int(price_match.group(1)) if price_match else None
                    
                    # Try to find products by category keywords
                    category_keywords = {
                        'Meat': ['meat', 'beef', 'chicken', 'pork', 'protein'],
                        'Fruits': ['fruit', 'apple', 'banana', 'orange'],
                        'Bakery': ['bread', 'bakery', 'baked'],
                        'Beverages': ['drink', 'beverage', 'juice', 'coffee'],
                        'Pantry': ['pasta', 'rice', 'cereal', 'pantry']
                    }
                    
                    found_category = None
                    for category, keywords in category_keywords.items():
                        if any(keyword in message_lower for keyword in keywords):
                            found_category = category
                            break
                    
                    # Query database with found category and price
                    if found_category or price_limit:
                        products = self._get_products_from_db(
                            category=found_category,
                            max_price=price_limit,
                            limit=4
                        )
                        if products:
                            category_name = found_category.capitalize() if found_category else "products"
                            return self._format_product_recommendations(products, category_name, price_limit)
                    
                    return f"🌟 Our AI-curated catalog is constantly learning! I can analyze your shopping patterns to suggest products you'll love. What type of items are you looking for today?"
            
            elif intent == 'orders':
                return f"📦 I'm tracking your orders in real-time using AI-powered logistics! Let me check your current order status and provide detailed updates on delivery progress."
            
            elif intent == 'recommendations':
                return f"🤖 I'm running advanced machine learning algorithms to analyze your shopping history, preferences, and trending patterns. This will take just a moment to generate personalized recommendations..."
            
            elif intent == 'weather':
                return f"🌤️ While I can't predict weather, my AI can suggest weather-appropriate products! Based on seasonal patterns and weather data, I can recommend rain gear, summer essentials, or cozy winter items. What season are you shopping for?"
            
            elif intent == 'general':
                # Handle general questions like jokes, casual conversation
                if any(word in message.lower() for word in ['joke', 'funny', 'laugh', 'humor']):
                    jokes = [
                        "🛒 Why don't shopping carts ever get lonely? Because they always have a lot of items to carry around! 😄",
                        "🛍️ What do you call a fish that wears a bowtie? So-fish-ticated! 🐠",
                        "📦 Why did the grocery bag go to therapy? It was feeling empty inside! 🛍️",
                        "🥕 What do you call a fake noodle? An impasta! 🍝",
                        "🍎 Why don't eggs tell jokes? They'd crack each other up! 🥚",
                        "🛒 What's a shopping cart's favorite type of music? Cart-oon music! 🎵",
                        "🥬 Why did the lettuce break up with the tomato? It couldn't ketchup! 🍅",
                        "🛍️ What do you call a shopping bag that tells jokes? A pun-ch bag! 💼",
                        "🍌 Why don't bananas ever get lonely? Because they hang out in bunches! 🍌🍌",
                        "🥛 What's a milk carton's favorite game? Hide and go lactose! 🥛",
                        "🛒 What do you call a shopping list that's feeling down? A grocery list! 😢",
                        "🍞 Why did the bread go to the doctor? It was feeling crumby! 🍞",
                        "🥚 What's an egg's favorite comedy show? The Yolk Show! 🥚",
                        "🛍️ Why don't shopping lists ever get tired? Because they're always checking things off! ✅",
                        "🥕 What do you call a carrot that's good at telling jokes? A funny root! 🥕"
                    ]
                    import random
                    return random.choice(jokes)
                else:
                    return f"😊 I'm your AI shopping assistant! While I'm great at helping with shopping lists, products, and recommendations, I also enjoy a good conversation. What would you like to know about our smart shopping features?"
            
            else:
                return f"🎯 I'm your AI-powered shopping companion! I use machine learning to understand your needs and provide intelligent assistance with lists, products, orders, and personalized recommendations."
                
        except Exception as e:
            logger.error(f"AI response generation failed: {e}")
            return self._get_fallback_response(intent)
    
    def _get_fallback_response(self, intent: str) -> str:
        """Get fallback response when AI generation fails"""
        import random
        if intent in self.responses:
            return random.choice(self.responses[intent])
        return "I'm here to help! What can I assist you with today?"
    
    def clear_user_history(self, user_id: str):
        """Clear conversation history for a specific user"""
        if user_id in self.context_memory:
            del self.context_memory[user_id]
        if user_id in self.conversation_history:
            del self.conversation_history[user_id]
    
    def clear_all_history(self):
        """Clear all conversation history"""
        self.context_memory.clear()
        self.conversation_history.clear()

# Initialize chatbot and recommendation engine
chatbot = AIChatbot()
MODEL_PATH = os.getenv('MODEL_PATH', './data/recommendation_model.pkl')
engine = RecommendationEngine(data_path='./data')

# Load existing model if available
try:
    if os.path.exists(MODEL_PATH):
        engine.load_model(MODEL_PATH)
        logger.info("Loaded existing recommendation model")
    else:
        logger.warning("No pre-trained model found. Training required.")
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'IntelliCart ML Recommendation API',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': engine.user_item_matrix is not None
    })

@app.route('/api/chatbot/process', methods=['POST'])
def process_chatbot_message():
    """Process chatbot message"""
    try:
        data = request.get_json()
        user_input = data.get('message', '')
        user_id = data.get('user_id', 'default_user')
        
        if not user_input:
            return jsonify({'error': 'Message is required'}), 400
        
        response = chatbot.get_response(user_input, user_id)
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Chatbot processing failed: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot/messages', methods=['DELETE'])
def clear_chat_history():
    """Clear chat history for all users"""
    try:
        # Clear chatbot memory and conversation history
        chatbot.clear_all_history()
        
        logger.info("Chat history cleared successfully")
        return jsonify({
            'success': True,
            'message': 'Chat history cleared successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to clear chat history: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# TRAINING ENDPOINTS
# ============================================================================

@app.route('/api/ml/train', methods=['POST'])
def train_model():
    """
    Train the recommendation model with provided data

    Expected JSON body:
    {
        "orders": [...],
        "products": [...],
        "orderItems": [...],
        "lists": [...]  # optional
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Extract data
        orders_data = data.get('orders', [])
        products_data = data.get('products', [])
        order_items_data = data.get('orderItems', [])
        lists_data = data.get('lists', [])

        if not orders_data or not products_data or not order_items_data:
            return jsonify({
                'error': 'Missing required data (orders, products, or orderItems)'
            }), 400

        logger.info(f"Training model with {len(orders_data)} orders, "
                   f"{len(products_data)} products, "
                   f"{len(order_items_data)} order items")

        # Train model
        stats = engine.train(
            orders_data=orders_data,
            products_data=products_data,
            order_items_data=order_items_data,
            lists_data=lists_data
        )

        # Save model
        model_path = engine.save_model(MODEL_PATH)

        return jsonify({
            'success': True,
            'message': 'Model trained successfully',
            'statistics': stats,
            'model_path': model_path
        })

    except Exception as e:
        logger.error(f"Error training model: {str(e)}", exc_info=True)
        return jsonify({
            'error': f'Training failed: {str(e)}'
        }), 500


@app.route('/api/ml/model/info', methods=['GET'])
def model_info():
    """Get information about the current model"""
    try:
        if engine.user_item_matrix is None:
            return jsonify({
                'trained': False,
                'message': 'Model not trained yet'
            })

        return jsonify({
            'trained': True,
            'num_users': len(engine.users),
            'num_products': len(engine.items),
            'matrix_shape': {
                'rows': engine.user_item_matrix.shape[0],
                'cols': engine.user_item_matrix.shape[1]
            },
            'has_item_similarity': engine.item_similarity_matrix is not None,
            'has_user_similarity': engine.user_similarity_matrix is not None,
            'has_content_similarity': engine.content_similarity_matrix is not None,
            'has_popularity_scores': engine.popularity_scores is not None
        })

    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# RECOMMENDATION ENDPOINTS
# ============================================================================

@app.route('/api/ml/recommendations/personalized', methods=['POST'])
def get_personalized_recommendations():
    """
    Get personalized recommendations for a user

    Expected JSON body:
    {
        "userId": "user_id_here",
        "limit": 10,
        "cfWeight": 0.5,
        "contentWeight": 0.3,
        "popularityWeight": 0.2
    }
    """
    try:
        data = request.get_json()

        if not data or 'userId' not in data:
            return jsonify({'error': 'userId is required'}), 400

        user_id = data['userId']
        limit = data.get('limit', 10)
        cf_weight = data.get('cfWeight', 0.5)
        content_weight = data.get('contentWeight', 0.3)
        popularity_weight = data.get('popularityWeight', 0.2)

        # Check if model is trained
        if engine.user_item_matrix is None:
            return jsonify({
                'error': 'Model not trained yet',
                'recommendations': []
            }), 503

        # Get recommendations
        recommendations = engine.get_hybrid_recommendations(
            user_id=user_id,
            n=limit,
            cf_weight=cf_weight,
            content_weight=content_weight,
            popularity_weight=popularity_weight
        )

        return jsonify({
            'success': True,
            'userId': user_id,
            'recommendations': recommendations,
            'count': len(recommendations)
        })

    except Exception as e:
        logger.error(f"Error getting personalized recommendations: {str(e)}")
        return jsonify({
            'error': str(e),
            'recommendations': []
        }), 500


@app.route('/api/ml/recommendations/trending', methods=['GET'])
def get_trending_recommendations():
    """
    Get trending products

    Query params:
    - limit: Number of recommendations (default: 10)
    - days: Time window in days (default: 30)
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        days = request.args.get('days', 30, type=int)

        if engine.popularity_scores is None:
            return jsonify({
                'error': 'Model not trained yet',
                'recommendations': []
            }), 503

        recommendations = engine.get_trending_products(n=limit, days=days)

        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'count': len(recommendations)
        })

    except Exception as e:
        logger.error(f"Error getting trending recommendations: {str(e)}")
        return jsonify({
            'error': str(e),
            'recommendations': []
        }), 500


@app.route('/api/ml/recommendations/related/<product_id>', methods=['GET'])
def get_related_recommendations(product_id: str):
    """
    Get products related to a specific product

    Query params:
    - limit: Number of recommendations (default: 10)
    """
    try:
        limit = request.args.get('limit', 10, type=int)

        if engine.item_similarity_matrix is None:
            return jsonify({
                'error': 'Model not trained yet',
                'recommendations': []
            }), 503

        recommendations = engine.get_related_products(
            product_id=product_id,
            n=limit
        )

        return jsonify({
            'success': True,
            'productId': product_id,
            'recommendations': recommendations,
            'count': len(recommendations)
        })

    except Exception as e:
        logger.error(f"Error getting related recommendations: {str(e)}")
        return jsonify({
            'error': str(e),
            'recommendations': []
        }), 500


@app.route('/api/ml/recommendations/collaborative', methods=['POST'])
def get_collaborative_recommendations():
    """Get collaborative filtering recommendations"""
    try:
        data = request.get_json()

        if not data or 'userId' not in data:
            return jsonify({'error': 'userId is required'}), 400

        user_id = data['userId']
        limit = data.get('limit', 10)

        if engine.item_similarity_matrix is None:
            return jsonify({
                'error': 'Model not trained yet',
                'recommendations': []
            }), 503

        recommendations = engine.get_collaborative_recommendations(
            user_id=user_id,
            n=limit
        )

        # Format results
        formatted_recs = [
            {
                'productId': str(product_id),
                'score': float(score),
                'confidence': float(score)
            }
            for product_id, score in recommendations
        ]

        return jsonify({
            'success': True,
            'userId': user_id,
            'recommendations': formatted_recs,
            'count': len(formatted_recs)
        })

    except Exception as e:
        logger.error(f"Error getting collaborative recommendations: {str(e)}")
        return jsonify({
            'error': str(e),
            'recommendations': []
        }), 500


@app.route('/api/ml/recommendations/content', methods=['POST'])
def get_content_recommendations():
    """Get content-based recommendations"""
    try:
        data = request.get_json()

        if not data or 'userId' not in data:
            return jsonify({'error': 'userId is required'}), 400

        user_id = data['userId']
        limit = data.get('limit', 10)

        if engine.content_similarity_matrix is None:
            return jsonify({
                'error': 'Model not trained yet',
                'recommendations': []
            }), 503

        recommendations = engine.get_content_based_recommendations(
            user_id=user_id,
            n=limit
        )

        # Format results
        formatted_recs = [
            {
                'productId': str(product_id),
                'score': float(score),
                'confidence': float(score)
            }
            for product_id, score in recommendations
        ]

        return jsonify({
            'success': True,
            'userId': user_id,
            'recommendations': formatted_recs,
            'count': len(formatted_recs)
        })

    except Exception as e:
        logger.error(f"Error getting content recommendations: {str(e)}")
        return jsonify({
            'error': str(e),
            'recommendations': []
        }), 500


# ============================================================================
# EVALUATION ENDPOINTS
# ============================================================================

@app.route('/api/ml/evaluate', methods=['POST'])
def evaluate_model():
    """
    Evaluate model performance

    Expected JSON body:
    {
        "testData": [...]  # Test order items
    }
    """
    try:
        data = request.get_json()

        if not data or 'testData' not in data:
            return jsonify({'error': 'testData is required'}), 400

        test_data = data['testData']

        if engine.user_item_matrix is None:
            return jsonify({
                'error': 'Model not trained yet'
            }), 503

        metrics = engine.evaluate_model(test_data)

        return jsonify({
            'success': True,
            'metrics': metrics
        })

    except Exception as e:
        logger.error(f"Error evaluating model: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@app.route('/api/ml/reload', methods=['POST'])
def reload_model():
    """Reload model from disk"""
    try:
        success = engine.load_model(MODEL_PATH)

        if success:
            return jsonify({
                'success': True,
                'message': 'Model reloaded successfully',
                'num_users': len(engine.users),
                'num_products': len(engine.items)
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to reload model'
            }), 500

    except Exception as e:
        logger.error(f"Error reloading model: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/ml/stats', methods=['GET'])
def get_statistics():
    """Get recommendation engine statistics"""
    try:
        if engine.user_item_matrix is None:
            return jsonify({
                'trained': False,
                'message': 'Model not trained yet'
            })

        # Calculate statistics
        stats = {
            'trained': True,
            'users': {
                'total': len(engine.users),
                'sample': engine.users[:5] if len(engine.users) > 0 else []
            },
            'products': {
                'total': len(engine.items),
                'sample': engine.items[:5] if len(engine.items) > 0 else []
            },
            'matrix': {
                'shape': {
                    'users': engine.user_item_matrix.shape[0],
                    'products': engine.user_item_matrix.shape[1]
                },
                'density': float(
                    engine.user_item_matrix.values.sum() /
                    (engine.user_item_matrix.shape[0] * engine.user_item_matrix.shape[1])
                ),
                'total_interactions': int(engine.user_item_matrix.values.sum())
            },
            'models': {
                'item_similarity': engine.item_similarity_matrix is not None,
                'user_similarity': engine.user_similarity_matrix is not None,
                'content_similarity': engine.content_similarity_matrix is not None,
                'popularity_scores': engine.popularity_scores is not None
            }
        }

        return jsonify(stats)

    except Exception as e:
        logger.error(f"Error getting statistics: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'The requested endpoint does not exist'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    port = int(os.getenv('ML_API_PORT', 5001))
    debug = os.getenv('FLASK_ENV', 'production') == 'development'

    logger.info(f"Starting IntelliCart ML API Server on port {port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Model path: {MODEL_PATH}")

    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
