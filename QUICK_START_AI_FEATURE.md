# 🚀 Quick Start Guide - AI Quick Add Feature

## Installation (5 minutes)

### Step 1: Install Python Dependencies
```bash
cd "C:\Users\amin kboubi\Desktop\IA project\smartShopAI"
pip install motor rapidfuzz pymongo
```

Or use the requirements file:
```bash
pip install -r ai_quick_add_requirements.txt
```

### Step 2: Verify MongoDB is Running
Make sure your MongoDB instance is running on `localhost:27017` with the `smartshop` database.

### Step 3: Test the Feature

#### Option A: Test with Jupyter Notebook
```bash
jupyter notebook ai_quick_add.ipynb
```
Then run all cells to see the demonstration.

#### Option B: Test with Python Script
```bash
python ai_quick_add.py
```
This will run the example in the script.

---

## Usage in Your Application

### Method 1: Direct Python Integration

```python
from ai_quick_add import AIQuickAdd
import asyncio

async def add_items_to_list(user_input, list_id):
    ai = AIQuickAdd(
        connection_string="mongodb://localhost:27017",
        database_name="smartshop",
        match_threshold=60
    )
    
    try:
        result = await ai.process_quick_add(user_input, list_id)
        return result
    finally:
        await ai.close()

# Use it
result = asyncio.run(add_items_to_list("3kg potato, milk, chicken", "your_list_id"))
print(f"Added {result['total_added']} items")
```

### Method 2: Express.js Integration

Add this route to your `server/routes.ts`:

```typescript
// AI Quick Add endpoint
app.post("/api/lists/:id/quick-add", async (req, res) => {
  try {
    const { inputText } = req.body;
    const listId = req.params.id;
    
    // Call Python script
    const { spawn } = require('child_process');
    const python = spawn('python', [
      'ai_quick_add_wrapper.py',
      inputText,
      listId,
      '60'  // threshold
    ]);
    
    let result = '';
    python.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        res.json(JSON.parse(result));
      } else {
        res.status(500).json({ error: 'Failed to process quick add' });
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to process quick add' });
  }
});
```

### Method 3: Standalone CLI

```bash
python ai_quick_add_wrapper.py "3kg potato, 2 litre milk" "507f1f77bcf86cd799439011" 60
```

---

## Frontend Integration Example

### React Component

```typescript
import { useState } from 'react';

function QuickAddInput({ listId }: { listId: string }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickAdd = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/lists/${listId}/quick-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: input })
      });
      
      const result = await response.json();
      
      if (result.total_added > 0) {
        alert(`Added ${result.total_added} items!`);
        setInput('');
        // Refresh the list
      }
      
      if (result.total_unmatched > 0) {
        alert(`Could not match: ${result.unmatched_items.join(', ')}`);
      }
      
    } catch (error) {
      alert('Error adding items');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g., 3kg potato, 2 litre milk, chicken"
        className="w-full p-2 border rounded"
      />
      <button
        onClick={handleQuickAdd}
        disabled={loading || !input}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? 'Adding...' : 'Quick Add'}
      </button>
    </div>
  );
}
```

---

## Testing

### Test with Mock Data

```python
# Create a simple test script
from ai_quick_add import AIQuickAdd
import asyncio

async def test():
    ai = AIQuickAdd()
    
    # Test parsing
    items = ai.parse_input_text("3kg potato, 2 litre milk, chicken")
    print(f"Parsed: {items}")
    
    # Test product name extraction
    for item in items:
        name = ai.extract_product_name(item)
        qty, unit = ai.extract_quantity_and_unit(item)
        print(f"{item} -> {name} ({qty} {unit})")
    
    await ai.close()

asyncio.run(test())
```

### Expected Output
```
Parsed: ['3kg potato', '2 litre milk', 'chicken']
3kg potato -> potato (3.0 kg)
2 litre milk -> milk (2.0 litre)
chicken -> chicken (1.0 units)
```

---

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'motor'"
**Solution**: Install dependencies
```bash
pip install motor rapidfuzz pymongo
```

### Issue: "Connection refused to MongoDB"
**Solution**: Start MongoDB
```bash
mongod
```

### Issue: "No matches found"
**Solution**: 
1. Check if products exist in database
2. Lower the threshold (try 40-50)
3. Add more products to test with

### Issue: "ImportError in Node.js"
**Solution**: Install python-shell
```bash
npm install python-shell
```

---

## Configuration Options

### Adjust Match Threshold

More strict (fewer matches):
```python
ai = AIQuickAdd(match_threshold=80)
```

More lenient (more matches):
```python
ai = AIQuickAdd(match_threshold=40)
```

### Custom MongoDB Connection

```python
ai = AIQuickAdd(
    connection_string="mongodb://user:pass@host:port",
    database_name="my_database"
)
```

---

## Next Steps

1. ✅ Test the notebook: `jupyter notebook ai_quick_add.ipynb`
2. ✅ Add the Express route to your server
3. ✅ Integrate the frontend component
4. ✅ Test with real data
5. ✅ Adjust threshold based on your needs

---

## Support Files

- `AI_QUICK_ADD_README.md` - Full documentation
- `AI_QUICK_ADD_SUMMARY.md` - Feature summary
- `ai_quick_add.ipynb` - Interactive demo
- `ai_quick_add.py` - Main module
- `ai_quick_add_wrapper.py` - Node.js wrapper

---

**Ready to go!** 🎉

Start with the Jupyter Notebook to see it in action, then integrate into your Express.js backend.


