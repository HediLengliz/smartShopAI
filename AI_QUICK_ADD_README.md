# AI-Powered Quick Add Feature

## 📋 Overview

The AI-Powered Quick Add feature enables users to quickly add multiple items to their shopping list using natural language input. The system intelligently parses user input, extracts product names, and uses fuzzy matching to find the closest products in the database.

## 🎯 Features

- **Natural Language Processing**: Parse comma-separated items like "3kg potato, 2 litre milk, 1kg chicken"
- **Quantity Extraction**: Automatically extract quantities and units from user input
- **Fuzzy Matching**: Find products even with typos (e.g., "chiken" → "chicken")
- **Smart Filtering**: Only add items with good matches (configurable threshold)
- **Async Operations**: Efficient MongoDB operations using motor library

## 📁 Files

### 1. `ai_quick_add.ipynb`
Interactive Jupyter Notebook demonstrating the AI logic step-by-step:
- Text parsing examples
- Product name extraction
- Fuzzy matching demonstrations
- Complete workflow visualization

### 2. `ai_quick_add.py`
Production-ready Python module with the following classes and functions:

#### Main Class: `AIQuickAdd`
```python
class AIQuickAdd:
    def __init__(connection_string, database_name, match_threshold)
    async def process_quick_add(input_text, list_id, threshold)
    async def find_best_product_match(search_term, threshold)
    async def add_item_to_list(list_id, product_id, product_name, quantity, unit)
```

#### Helper Functions:
- `parse_input_text(input_text)` - Split and clean comma-separated input
- `extract_product_name(item_text)` - Remove quantities/units to get core product name
- `extract_quantity_and_unit(item_text)` - Extract numerical quantity and unit
- `quick_add_items()` - Standalone convenience function

### 3. `ai_quick_add_requirements.txt`
Python dependencies needed for the feature

## 🚀 Installation

1. **Install dependencies:**
```bash
pip install -r ai_quick_add_requirements.txt
```

Or install manually:
```bash
pip install motor rapidfuzz pymongo
```

2. **Ensure MongoDB is running** with the `smartshop` database

## 💻 Usage Examples

### Basic Usage

```python
from ai_quick_add import AIQuickAdd
import asyncio

async def main():
    # Initialize the AI Quick Add handler
    ai = AIQuickAdd(
        connection_string="mongodb://localhost:27017",
        database_name="smartshop",
        match_threshold=60
    )
    
    # Process user input
    result = await ai.process_quick_add(
        input_text="3kg potato, 2 litre milk, 1kg chicken",
        list_id="507f1f77bcf86cd799439011"
    )
    
    # Display results
    print(f"Added: {result['total_added']} items")
    print(f"Unmatched: {result['total_unmatched']} items")
    
    for item in result['added_items']:
        print(f"✓ {item['matched']} ({item['quantity']} {item['unit']})")
    
    await ai.close()

asyncio.run(main())
```

### Standalone Function

```python
from ai_quick_add import quick_add_items
import asyncio

result = asyncio.run(quick_add_items(
    input_text="apple, banana, orange",
    list_id="507f1f77bcf86cd799439011"
))
```

### Express.js Integration Example

```javascript
// In your Express routes
app.post('/api/quick-add', async (req, res) => {
  const { inputText, listId } = req.body;
  
  // Call Python script using child_process or python-shell
  const { PythonShell } = require('python-shell');
  
  const options = {
    mode: 'json',
    pythonPath: 'python',
    scriptPath: './python',
    args: [inputText, listId]
  };
  
  PythonShell.run('ai_quick_add_wrapper.py', options, (err, results) => {
    if (err) throw err;
    res.json(results[0]);
  });
});
```

## ⚙️ Configuration

### Match Threshold
Controls the fuzzy matching sensitivity (0-100):

- **80-100**: Very strict - Only near-perfect matches
- **60-79**: Balanced - Handles typos and variations (RECOMMENDED)
- **40-59**: Loose - More permissive matching
- **0-39**: Very loose - May include incorrect matches

**Recommended value**: 60-70

## 📊 Example Behavior

### Input
```
"3kg potato, 2 litre milk, 1kg chicken"
```

### Processing Steps

1. **Parse**: `["3kg potato", "2 litre milk", "1kg chicken"]`
2. **Extract Names**: `["potato", "milk", "chicken"]`
3. **Extract Quantities**: `[(3, "kg"), (2, "litre"), (1, "kg")]`
4. **Fuzzy Match**: Find closest products in database
5. **Add to List**: Insert matched items with quantities

### Output
```json
{
  "added_items": [
    {
      "original": "3kg potato",
      "matched": "Potato",
      "quantity": 3.0,
      "unit": "kg"
    },
    {
      "original": "2 litre milk",
      "matched": "Milk",
      "quantity": 2.0,
      "unit": "litre"
    },
    {
      "original": "1kg chicken",
      "matched": "Chicken",
      "quantity": 1.0,
      "unit": "kg"
    }
  ],
  "unmatched_items": [],
  "total_added": 3,
  "total_unmatched": 0
}
```

## 🧪 Testing

### Run the Jupyter Notebook
```bash
jupyter notebook ai_quick_add.ipynb
```

### Run the Python Script
```bash
python ai_quick_add.py
```

### Unit Tests (Optional)
Create a test file `test_ai_quick_add.py`:

```python
import pytest
from ai_quick_add import AIQuickAdd

def test_parse_input():
    result = AIQuickAdd.parse_input_text("apple, banana, orange")
    assert result == ["apple", "banana", "orange"]

def test_extract_product_name():
    assert AIQuickAdd.extract_product_name("3kg potato") == "potato"
    assert AIQuickAdd.extract_product_name("2 litre milk") == "milk"

def test_extract_quantity_and_unit():
    assert AIQuickAdd.extract_quantity_and_unit("3kg potato") == (3.0, "kg")
    assert AIQuickAdd.extract_quantity_and_unit("2 litre milk") == (2.0, "litre")
```

## 🔧 Supported Units

### Weight
- kg, g, lb, lbs, oz, pound, pounds, ounce, ounces

### Volume
- litre, liter, l, ml, mls, gallon, gallons, pint, pints, cup, cups

### Count
- piece, pieces, pcs, pc, item, items, pack, packs, box, boxes, bag, bags

### Special
- dozen, dozens, bunch, bunches, head, heads

## 🐛 Troubleshooting

### "No matches found"
- Check if products exist in the database
- Lower the match_threshold value
- Ensure product names are not too different from input

### "Connection error"
- Verify MongoDB is running
- Check connection string
- Ensure database name is correct

### "Import error"
- Install dependencies: `pip install -r ai_quick_add_requirements.txt`
- Use Python 3.7+

## 📝 API Reference

### `process_quick_add(input_text, list_id, threshold=None)`

**Parameters:**
- `input_text` (str): Comma-separated items
- `list_id` (str): MongoDB ObjectId of the shopping list
- `threshold` (int, optional): Fuzzy match threshold

**Returns:**
```python
{
    'added_items': [
        {'original': str, 'matched': str, 'quantity': float, 'unit': str}
    ],
    'unmatched_items': [str],
    'total_added': int,
    'total_unmatched': int
}
```

## 🎓 How It Works

1. **Text Parsing**: Split input by commas and clean whitespace
2. **Name Extraction**: Use regex to remove quantities/units
3. **Quantity Extraction**: Parse numbers and units from original text
4. **Fuzzy Matching**: Use RapidFuzz's ratio scorer to find best matches
5. **Database Insertion**: Add matched items with extracted quantities to MongoDB

## 📄 License

This feature is part of the Smart Shopping AI project.

## 👥 Authors

Smart Shopping AI Team - 2025

## 🔗 Related Files

- `server/services/ai-agents.ts` - AI agent services
- `server/routes.ts` - API routes
- `server/storage.ts` - Database operations
- `python-ml/` - Other ML features


