#!/usr/bin/env python3
"""
Debug script to check MongoDB products and fuzzy matching
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from rapidfuzz import fuzz, process

async def debug_products():
    # Connect to MongoDB (try different database names)
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    
    # Try different database names
    db_names = ["intellicart", "smartshop", "test", "rest-express"]
    products = []
    db_name_used = None
    
    for db_name in db_names:
        print(f"\nTrying database: {db_name}")
        db = client[db_name]
        products_collection = db.products
        
        # Get all products
        cursor = products_collection.find({}, {"name": 1, "_id": 1})
        products = await cursor.to_list(length=None)
        
        print(f"Found {len(products)} products in {db_name}")
        
        if products:
            print("Products:")
            for i, product in enumerate(products[:5], 1):  # Show first 5
                print(f"  {i}. {product['name']}")
            if len(products) > 5:
                print(f"  ... and {len(products) - 5} more")
            db_name_used = db_name
            break
    
    if not products:
        print("\nNo products found in any database!")
        client.close()
        return
    
    print(f"\nUsing database: {db_name_used}")
    print("=" * 50)
    print("Testing fuzzy matching:")
    
    # Test fuzzy matching
    product_names = [product["name"] for product in products]
    test_queries = ["potato", "milk", "coffee", "chicken", "apple"]
    
    for query in test_queries:
        best_match = process.extractOne(query, product_names, scorer=fuzz.ratio)
        if best_match:
            print(f"'{query}' -> '{best_match[0]}' (score: {best_match[1]})")
        else:
            print(f"'{query}' -> NO MATCH")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(debug_products())