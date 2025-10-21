#!/usr/bin/env python3
"""
Test MongoDB connection for Python AI server
"""
import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv('../.env')

def test_mongodb_connection():
    """Test MongoDB connection"""
    try:
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/intellicart')
        print(f"MongoDB URI: {mongodb_uri}")
        
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        # Test connection
        client.server_info()
        db = client['intellicart']
        
        print("✓ Connected to MongoDB database")
        
        # Test products collection
        products = list(db.products.find({'category': 'Dairy'}).limit(5))
        print(f"Found {len(products)} dairy products:")
        for product in products:
            print(f"  - {product['name']}: ${product['price']}")
        
        # Test price filtering
        cheap_dairy = list(db.products.find({'category': 'Dairy', 'price': {'$lte': 3.0}}))
        print(f"Found {len(cheap_dairy)} dairy products under $3:")
        for product in cheap_dairy:
            print(f"  - {product['name']}: ${product['price']}")
            
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False

if __name__ == "__main__":
    test_mongodb_connection()
