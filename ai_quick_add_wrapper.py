#!/usr/bin/env python3
"""
Wrapper script for AI Quick Add feature
This script can be called from Node.js/Express to process quick add requests

Usage:
    python ai_quick_add_wrapper.py <input_text> <list_id> [threshold]

Example:
    python ai_quick_add_wrapper.py "3kg potato, 2 litre milk" "507f1f77bcf86cd799439011" 60
"""

import sys
import json
import asyncio
from ai_quick_add import AIQuickAdd


async def main():
    # Parse command line arguments
    if len(sys.argv) < 3:
        print(json.dumps({
            "error": "Missing arguments. Usage: python ai_quick_add_wrapper.py <input_text> <list_id> [threshold]"
        }))
        sys.exit(1)
    
    input_text = sys.argv[1]
    list_id = sys.argv[2]
    threshold = int(sys.argv[3]) if len(sys.argv) > 3 else 70
    
    # Optional: Read MongoDB connection from environment or config
    connection_string = sys.argv[4] if len(sys.argv) > 4 else "mongodb://localhost:27017"
    database_name = sys.argv[5] if len(sys.argv) > 5 else "intellicart"
    
    # Initialize AI Quick Add
    ai = AIQuickAdd(
        connection_string=connection_string,
        database_name=database_name,
        match_threshold=threshold
    )
    
    try:
        # Process the quick add request
        result = await ai.process_quick_add(input_text, list_id)       
        
        # Output result as JSON
        print(json.dumps(result, default=str))
        
    except Exception as e:
        # Output error as JSON
        print(json.dumps({
            "error": str(e),
            "added_items": [],
            "unmatched_items": [],
            "total_added": 0,
            "total_unmatched": 0
        }))
        sys.exit(1)
    
    finally:
        await ai.close()


if __name__ == "__main__":
    asyncio.run(main())
