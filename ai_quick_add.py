"""
AI Quick Add - FIXED CATEGORY DETECTION VERSION
"""

import re
import json
import asyncio
import sys
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from rapidfuzz import fuzz
from bson import ObjectId

KG_TO_LB = 2.20462  # unit conversion constant


def _safe_float(s: str) -> Optional[float]:
    try:
        return float(s)
    except Exception:
        return None


class AIQuickAdd:
    def __init__(
        self,
        connection_string: str = "mongodb://localhost:27017",
        database_name: str = "intellicart",
        match_threshold: int = 65,
        default_quantity: float = 3.0,
        default_unit: str = "lbs",
    ):
        self.client = AsyncIOMotorClient(connection_string)
        self.db = self.client[database_name]
        self.products_collection = self.db["products"]
        self.list_items_collection = self.db["listitems"]
        self.match_threshold = match_threshold
        self.default_quantity = default_quantity
        self.default_unit = default_unit
        
        # Expanded synonyms dictionary
        self.synonyms = {
            "chicken": ["chiken", "chickn", "chiken breast", "chickn breast"],
            "coffee": ["cofee", "coffe", "cofee beans", "coffe beans"],
            "potato": ["potatoe", "potatoes"],
            "tomato": ["tomatoe", "tomatoes"],
            "banana": ["bananna", "bananas"],
            "apple": ["apples", "aplle"],
            "milk": ["milkk", "milk carton"],
            "bread": ["bred", "bread loaf"],
            "cheese": ["cheeze", "cheese block"],
            "egg": ["eggs", "eggs dozen"],
            "rice": ["rise", "white rice"],
            "pasta": ["past", "pasta noodles"],
            "yogurt": ["yoghurt", "yogurt cup"],
            "butter": ["butter stick", "butter block"],
            "sugar": ["suger", "white sugar"],
            "flour": ["flower", "all purpose flour"],
            "oil": ["oil bottle", "olive oil"],
            "salt": ["salt container", "table salt"],
            "pepper": ["pepper powder", "black pepper"],
        }
        
        # Meal category items
        self.meal_categories = {
            "breakfast": [
                "eggs", "milk", "bread", "butter", "yogurt", "cereal", "oatmeal", 
                "coffee", "tea", "orange juice", "banana", "apple", "pancake mix", 
                "syrup", "bacon", "sausage", "cheese", "jam", "honey"
            ],
            "dinner": [
                "chicken", "beef", "pork", "fish", "salmon", "pasta", "rice", 
                "potato", "tomato", "onion", "garlic", "broccoli", "carrot", 
                "lettuce", "oil", "salt", "pepper", "flour", "butter", "cheese",
                "bread", "milk", "cream", "lemon", "herbs"
            ],
            "lunch": [
                "bread", "cheese", "ham", "turkey", "lettuce", "tomato", "mayonnaise",
                "mustard", "chips", "apple", "banana", "yogurt", "juice", "water",
                "cookies", "crackers", "soup", "pasta"
            ],
            "snacks": [
                "chips", "cookies", "crackers", "nuts", "chocolate", "popcorn",
                "yogurt", "apple", "banana", "orange", "juice", "water", "soda",
                "granola bar", "trail mix"
            ]
        }
        
        # Generic product categories
        self.generic_categories = {
            "meat": ["chicken", "beef", "pork", "steak", "fish", "salmon", "turkey", "bacon", "sausage", "ham"],
            "vegetables": ["potato", "tomato", "onion", "garlic", "broccoli", "carrot", "lettuce", "spinach", "cucumber", "pepper"],
            "fruits": ["apple", "banana", "orange", "lemon", "grape", "strawberry", "blueberry", "mango", "pineapple"],
            "dairy": ["milk", "cheese", "yogurt", "butter", "cream", "sour cream", "cottage cheese"],
            "beverages": ["water", "juice", "soda", "coffee", "tea", "milk", "sports drink"],
            "pantry": ["rice", "pasta", "flour", "sugar", "oil", "salt", "pepper", "cereal", "oatmeal"],
            "bakery": ["bread", "bagel", "croissant", "muffin", "cake", "cookie", "cracker"],
            "seafood": ["fish", "salmon", "tuna", "shrimp", "crab", "lobster", "clam"],
            "frozen": ["frozen pizza", "frozen vegetables", "ice cream", "frozen dinner"],
            "canned": ["canned soup", "canned beans", "canned vegetables", "canned fruit"]
        }

    # -------------------------------
    # Text normalization and category detection
    # -------------------------------
    @staticmethod
    def normalize_text(text: str) -> str:
        """Normalize text for comparison"""
        if not text:
            return ""
        return ' '.join(text.lower().split())

    @staticmethod
    def detect_category(search_term: str) -> str:
        """Detect category from search term"""
        search_term = search_term.lower()
        category_keywords = {
            "produce": ["apple", "banana", "orange", "lettuce", "carrot", "broccoli", "vegetable", "fruit"],
            "meat": ["chicken", "beef", "pork", "steak", "fish", "salmon", "meat"],
            "dairy": ["milk", "cheese", "yogurt", "butter", "cream", "dairy"],
            "pantry": ["rice", "pasta", "flour", "sugar", "oil", "spice", "coffee", "tea"],
            "beverages": ["water", "juice", "soda", "coffee", "tea", "drink"]
        }
        
        for category, keywords in category_keywords.items():
            if any(keyword in search_term for keyword in keywords):
                return category
        return ""

    async def find_by_category(self, search_term: str, products: List[Dict]) -> Optional[Dict]:
        """Find product by category - only used as tiebreaker"""
        search_category = self.detect_category(search_term)
        if not search_category:
            return None
            
        category_products = []
        for product in products:
            product_category = product.get("category", "").lower()
            if search_category in product_category:
                category_products.append(product)
        
        return category_products[0] if category_products else None

    # -------------------------------
    # Meal category detection
    # -------------------------------
    def detect_meal_category(self, search_term: str) -> Optional[str]:
        """Detect if the search term is a meal category"""
        search_term = search_term.lower().strip()
        
        meal_keywords = {
            "breakfast": ["breakfast", "morning meal", "brunch"],
            "lunch": ["lunch", "midday meal", "noon meal"],
            "dinner": ["dinner", "supper", "evening meal", "night meal"],
            "snacks": ["snack", "snacks", "munchies", "nibbles"]
        }
        
        for meal_category, keywords in meal_keywords.items():
            if any(keyword in search_term for keyword in keywords):
                return meal_category
        return None

    async def get_products_for_meal(self, meal_category: str, products: List[Dict]) -> List[Dict]:
        """Get appropriate products for a specific meal category"""
        meal_items = self.meal_categories.get(meal_category, [])
        matched_products = []
        
        for product in products:
            product_name = self.normalize_text(product.get("name", ""))
            
            # Check if product matches any items in the meal category
            for meal_item in meal_items:
                if (fuzz.partial_ratio(meal_item, product_name) > 70 or 
                    meal_item in product_name):
                    matched_products.append(product)
                    break
        
        # Remove duplicates by product ID
        seen_ids = set()
        unique_products = []
        for product in matched_products:
            product_id = str(product.get("_id"))
            if product_id not in seen_ids:
                seen_ids.add(product_id)
                unique_products.append(product)
        
        return unique_products[:5]  # Return max 5 items per meal category

    # -------------------------------
    # FIXED Generic category detection
    # -------------------------------
    def detect_generic_category(self, search_term: str) -> Optional[str]:
        """Detect if the search term is a generic product category - FIXED VERSION"""
        search_term = search_term.lower().strip()
        
        # FIXED: Only detect actual category names, not specific products
        # Only trigger for explicit category words, not individual product names
        category_keywords = {
            "meat": ["meat", "meats", "protein"],
            "vegetables": ["vegetable", "vegetables", "veggies", "veggie"],
            "fruits": ["fruit", "fruits"],
            "dairy": ["dairy"],
            "beverages": ["beverage", "beverages", "drinks"],
            "pantry": ["pantry", "staples", "dry goods"],
            "bakery": ["bakery", "baked goods"],
            "seafood": ["seafood"],
            "frozen": ["frozen", "frozen food"],
            "canned": ["canned", "canned food"]
        }
        
        # Only return category if it's an exact match or very close to category names
        # Don't match specific products like "chicken", "beef", "apple", etc.
        for category, keywords in category_keywords.items():
            # Check for exact matches first
            if search_term in keywords:
                return category
            
            # Check if search term contains category keywords (but be careful)
            for keyword in keywords:
                # Only match if the search term is primarily about the category
                # Not if it's a specific product that happens to contain the word
                if (keyword in search_term and 
                    len(search_term.split()) <= 2 and  # Only short phrases
                    fuzz.ratio(search_term, keyword) > 70):  # High similarity
                    return category
                    
        return None

    async def get_products_for_generic_category(self, category: str, products: List[Dict]) -> List[Dict]:
        """Get appropriate products for a generic category"""
        category_items = self.generic_categories.get(category, [])
        matched_products = []
        
        for product in products:
            product_name = self.normalize_text(product.get("name", ""))
            product_category = product.get("category", "").lower()
            
            # Strategy 1: Check if product name matches category items
            for category_item in category_items:
                if (fuzz.partial_ratio(category_item, product_name) > 70 or 
                    category_item in product_name):
                    matched_products.append(product)
                    break
            else:
                # Strategy 2: Check if product category matches
                if category in product_category:
                    matched_products.append(product)
        
        # Remove duplicates by product ID
        seen_ids = set()
        unique_products = []
        for product in matched_products:
            product_id = str(product.get("_id"))
            if product_id not in seen_ids:
                seen_ids.add(product_id)
                unique_products.append(product)
        
        return unique_products[:8]  # Return max 8 items per category

    # -------------------------------
    # Parsing input
    # -------------------------------
    @staticmethod
    def parse_input_text(input_text: str) -> List[str]:
        if not input_text or not input_text.strip():
            return []
        parts = [p.strip() for p in input_text.split(",")]
        return [p for p in parts if p]

    @staticmethod
    def extract_quantity_and_unit(item_text: str) -> Tuple[Optional[float], str, str]:
        text = item_text.strip()
        match = re.match(
            r'^\s*(\d+(\.\d+)?)\s*(kg|kilogram|kilograms|g|gram|grams|lb|lbs|pound|pounds|oz|ounce|ounces|litre|liter|l|ml|dozen|pack|pcs|piece)?\b(.*)$',
            text,
            flags=re.IGNORECASE,
        )
        if match:
            quantity = _safe_float(match.group(1)) or 1.0
            unit = (match.group(3) or "").lower().strip()
            remainder = (match.group(4) or "").strip()
            unit_map = {
                "kilogram": "kg", "kilograms": "kg",
                "gram": "g", "grams": "g",
                "pound": "lbs", "pounds": "lbs", "lb": "lbs", "lbs": "lbs",
                "ounce": "oz", "ounces": "oz",
                "liter": "l", "litre": "l", "l": "l", "ml": "ml",
                "dozen": "dozen", "pack": "pack",
                "pcs": "pcs", "piece": "pcs"
            }
            unit_norm = unit_map.get(unit, unit) if unit else ""
            return (quantity, unit_norm, remainder)
        return (None, "", text)

    @staticmethod
    def extract_product_name(item_text: str) -> str:
        cleaned = re.sub(
            r'^\s*\d+(\.\d+)?\s*(kg|g|lbs|lb|oz|pound|pounds|ounce|ounces|litre|liter|l|ml|dozen|pack|pcs|piece|items|item)?\b',
            "",
            item_text,
            flags=re.IGNORECASE,
        )
        cleaned = re.sub(r'^\s*of\s+', '', cleaned, flags=re.IGNORECASE)
        return cleaned.strip()

    # -------------------------------
    # STRICTER Product matching
    # -------------------------------
    async def get_all_products(self) -> List[Dict]:
        cursor = self.products_collection.find({})
        return await cursor.to_list(length=None)

    async def find_best_product_match(self, search_term: str, products: List[Dict]) -> Optional[Dict]:
        """STRICT matching - only matches when genuinely similar (>60%)"""
        if not products:
            return None

        search_term = self.normalize_text(search_term)
        print(f"[STRICT MATCH] Searching for: '{search_term}'", file=sys.stderr)

        # Strategy 1: Exact matches with synonyms (case insensitive)
        search_lower = search_term.lower()
        for product in products:
            product_name = product.get("name", "").lower()
            
            # Exact match
            if search_lower == product_name:
                print(f"[EXACT MATCH] '{search_term}' -> '{product.get('name')}'", file=sys.stderr)
                return product
            
            # Synonym match - check if search term is a synonym for this product
            for correct_word, synonyms_list in self.synonyms.items():
                if search_lower in synonyms_list and correct_word in product_name:
                    print(f"[SYNONYM MATCH] '{search_term}' -> '{product.get('name')}'", file=sys.stderr)
                    return product

        # Strategy 2: Strict fuzzy matching with multiple validations
        best_product, best_score = None, 0
        
        for product in products:
            product_name = self.normalize_text(product.get("name", ""))
            
            # Use multiple fuzzy algorithms for better accuracy
            token_set_score = fuzz.token_set_ratio(search_term, product_name)  # Best for typos
            partial_ratio_score = fuzz.partial_ratio(search_term, product_name)  # Best for partial matches
            
            # Use the higher score but apply stricter rules
            current_score = max(token_set_score, partial_ratio_score)
            
            # ADDITIONAL VALIDATION: Require minimum similarity for short words
            if len(search_term) <= 3 and current_score < 80:
                continue  # Skip low-confidence matches for very short words
                
            # PENALTY: If the search term looks like gibberish (repeating characters)
            if self._looks_like_gibberish(search_term) and current_score < 70:
                continue
                
            if current_score > best_score:
                best_product, best_score = product, current_score

        # STRICT THRESHOLD: Minimum 60% match required
        strict_threshold = max(60, self.match_threshold)
        
        if best_score < strict_threshold:
            print(f"[NO MATCH] '{search_term}' doesn't match any product (best score: {best_score} < {strict_threshold})", file=sys.stderr)
            return None

        print(f"[FUZZY MATCH] '{search_term}' -> '{best_product.get('name')}' (score={best_score})", file=sys.stderr)
        return best_product

    def _looks_like_gibberish(self, text: str) -> bool:
        """Check if text looks like random characters or gibberish"""
        if len(text) < 4:
            return False
            
        # Check for repeating characters (like "xxxxxx")
        if len(set(text)) <= 2:
            return True
            
        return False

    # -------------------------------
    # Stock + list management
    # -------------------------------
    @staticmethod
    def _product_measured_in_lbs(product: Dict) -> bool:
        name = (product.get("name") or "").lower()
        desc = (product.get("description") or "").lower()
        if "per lb" in name or "per lb" in desc:
            return True
        if product.get("category") and product.get("category").lower() in ("meat", "seafood"):
            return True
        return False

    async def decrement_product_stock(self, product: Dict, quantity: float, unit: str) -> Dict:
        product_id = product["_id"]
        current_stock = product.get("stock", 0)
        remove_amount = quantity
        if unit == "kg" and self._product_measured_in_lbs(product):
            remove_amount = quantity * KG_TO_LB
        new_stock = max(0, current_stock - remove_amount)
        await self.products_collection.update_one({"_id": product_id}, {"$set": {"stock": new_stock}})
        return await self.products_collection.find_one({"_id": product_id})

    async def add_item_to_list(self, list_id: str, product: Dict, quantity: float, unit: str) -> Dict:
        item_data = {
            "listId": ObjectId(list_id) if ObjectId.is_valid(list_id) else list_id,
            "productId": product.get("_id"),
            "name": product.get("name"),
            "quantity": quantity,
            "unit": unit,
            "status": "pending",
            "createdAt": datetime.now(timezone.utc)
        }
        res = await self.list_items_collection.insert_one(item_data)
        item_data["_id"] = res.inserted_id
        return item_data

    # -------------------------------
    # Main logic with FIXED category support
    # -------------------------------
    async def process_quick_add(self, input_text: str, list_id: str) -> Dict:
        parsed = self.parse_input_text(input_text)
        if not parsed:
            return {
                "added_items": [], 
                "unmatched_items": [], 
                "total_added": 0, 
                "total_unmatched": 0,
                "errors": ["No items provided"]
            }

        all_products = await self.get_all_products()
        added, unmatched, errors = [], [], []

        for raw in parsed:
            qty, unit, remainder = self.extract_quantity_and_unit(raw)
            candidate_name = remainder.strip() or self.extract_product_name(raw) or raw

            qty = qty if qty is not None else self.default_quantity
            unit = unit or self.default_unit

            # Check if this is a meal category request
            meal_category = self.detect_meal_category(candidate_name)
            if meal_category:
                print(f"[MEAL CATEGORY] Detected: '{candidate_name}' -> {meal_category}", file=sys.stderr)
                meal_products = await self.get_products_for_meal(meal_category, all_products)
                
                if not meal_products:
                    error_msg = f"No products found for {meal_category} category"
                    errors.append(error_msg)
                    unmatched.append(f"{raw} - {error_msg}")
                    continue
                
                # Add all meal products
                meal_added_count = 0
                for meal_product in meal_products:
                    try:
                        final_unit = unit if unit else ("lbs" if self._product_measured_in_lbs(meal_product) else "units")
                        updated_product = await self.decrement_product_stock(meal_product, qty, final_unit)
                        item_doc = await self.add_item_to_list(list_id, updated_product, qty, final_unit)
                        
                        added.append({
                            "original": f"{raw} ({meal_category} item)",
                            "matched": updated_product.get("name"),
                            "quantity": qty,
                            "unit": final_unit,
                            "product_stock_after": updated_product.get("stock"),
                            "list_item_id": str(item_doc["_id"]),
                            "meal_category": meal_category
                        })
                        meal_added_count += 1
                    except Exception as e:
                        print(f"[MEAL ERROR] Failed to add {meal_product.get('name')}: {e}", file=sys.stderr)
                
                if meal_added_count == 0:
                    error_msg = f"Failed to add any products for {meal_category}"
                    errors.append(error_msg)
                    unmatched.append(f"{raw} - {error_msg}")
                
                continue

            # Check if this is a generic category request (FIXED: now only detects actual category names)
            generic_category = self.detect_generic_category(candidate_name)
            if generic_category:
                print(f"[GENERIC CATEGORY] Detected: '{candidate_name}' -> {generic_category}", file=sys.stderr)
                category_products = await self.get_products_for_generic_category(generic_category, all_products)
                
                if not category_products:
                    error_msg = f"No products found for {generic_category} category"
                    errors.append(error_msg)
                    unmatched.append(f"{raw} - {error_msg}")
                    continue
                
                # Add all category products
                category_added_count = 0
                for category_product in category_products:
                    try:
                        final_unit = unit if unit else ("lbs" if self._product_measured_in_lbs(category_product) else "units")
                        updated_product = await self.decrement_product_stock(category_product, qty, final_unit)
                        item_doc = await self.add_item_to_list(list_id, updated_product, qty, final_unit)
                        
                        added.append({
                            "original": f"{raw} ({generic_category} item)",
                            "matched": updated_product.get("name"),
                            "quantity": qty,
                            "unit": final_unit,
                            "product_stock_after": updated_product.get("stock"),
                            "list_item_id": str(item_doc["_id"]),
                            "generic_category": generic_category
                        })
                        category_added_count += 1
                    except Exception as e:
                        print(f"[CATEGORY ERROR] Failed to add {category_product.get('name')}: {e}", file=sys.stderr)
                
                if category_added_count == 0:
                    error_msg = f"Failed to add any products for {generic_category}"
                    errors.append(error_msg)
                    unmatched.append(f"{raw} - {error_msg}")
                
                continue

            # Normal product matching for non-category items
            best_product = await self.find_best_product_match(candidate_name, all_products)
            if not best_product:
                error_msg = f"No product found matching '{candidate_name}'"
                errors.append(error_msg)
                unmatched.append(f"{raw} - {error_msg}")
                continue

            final_unit = unit if unit else ("lbs" if self._product_measured_in_lbs(best_product) else "units")

            try:
                updated_product = await self.decrement_product_stock(best_product, qty, final_unit)
                item_doc = await self.add_item_to_list(list_id, updated_product, qty, final_unit)
            except Exception as e:
                error_msg = f"Error adding '{candidate_name}': {str(e)}"
                errors.append(error_msg)
                unmatched.append(f"{raw} - {error_msg}")
                continue

            added.append({
                "original": raw,
                "matched": updated_product.get("name"),
                "quantity": qty,
                "unit": final_unit,
                "product_stock_after": updated_product.get("stock"),
                "list_item_id": str(item_doc["_id"])
            })

        result = {
            "added_items": added,
            "unmatched_items": unmatched,
            "total_added": len(added),
            "total_unmatched": len(unmatched),
        }
        
        if errors:
            result["errors"] = errors
            
        return result

    async def close(self):
        self.client.close()


# -------------------------
# CLI Usage
# -------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="AI Quick Add CLI (connects to MongoDB)")
    parser.add_argument("--input", "-i", help='Input text, e.g. "3kg potato, coffee" or "breakfast, meat, vegetables"', required=False)
    parser.add_argument("--list", "-l", help="List ID to add to", required=False, default="000000000000000000000000")
    args = parser.parse_args()

    async def _run():
        if not args.input:
            print("⚠️ No input provided. Examples:")
            print("  python ai_quick_add.py --input 'chiken, cofee, 2kg apple'")
            print("  python ai_quick_add.py --input 'breakfast'")
            print("  python ai_quick_add.py --input 'meat, vegetables, fruits'")
            print("  python ai_quick_add.py --input 'dairy, pantry, frozen'")
            return

        ai = AIQuickAdd(match_threshold=60)
        try:
            res = await ai.process_quick_add(args.input, args.list)
            print("\n✅ RESULT:")
            print(json.dumps(res, indent=2))
            
            # Print errors clearly
            if res.get("errors"):
                print("\n❌ ERRORS:")
                for error in res["errors"]:
                    print(f"  - {error}")
                    
            # Print category summary
            meal_items = [item for item in res.get("added_items", []) if item.get("meal_category")]
            category_items = [item for item in res.get("added_items", []) if item.get("generic_category")]
            
            if meal_items:
                print("\n🍽️  MEAL ITEMS ADDED:")
                meals = {}
                for item in meal_items:
                    meal = item.get("meal_category", "unknown")
                    if meal not in meals:
                        meals[meal] = []
                    meals[meal].append(item["matched"])
                
                for meal, items in meals.items():
                    print(f"  {meal.title()}: {', '.join(items)}")
            
            if category_items:
                print("\n🏷️  CATEGORY ITEMS ADDED:")
                categories = {}
                for item in category_items:
                    category = item.get("generic_category", "unknown")
                    if category not in categories:
                        categories[category] = []
                    categories[category].append(item["matched"])
                
                for category, items in categories.items():
                    print(f"  {category.title()}: {', '.join(items)}")
                    
        finally:
            await ai.close()

    asyncio.run(_run())