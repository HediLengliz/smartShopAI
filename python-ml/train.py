#!/usr/bin/env python3
"""
IntelliCart ML Model Training Script
Train recommendation models from MongoDB data
"""

import os
import sys
import json
import argparse
from datetime import datetime
from typing import Dict, List
from pymongo import MongoClient
from dotenv import load_dotenv

# Import recommendation engine
from recommendation_model import RecommendationEngine


def connect_to_mongodb(uri: str) -> MongoClient:
    """
    Connect to MongoDB

    Args:
        uri: MongoDB connection URI

    Returns:
        MongoClient instance
    """
    print(f"\n{'='*60}")
    print("CONNECTING TO MONGODB")
    print(f"{'='*60}")

    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        # Test connection
        client.server_info()
        print("✓ Successfully connected to MongoDB")
        return client
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {str(e)}")
        sys.exit(1)


def fetch_data_from_mongodb(client: MongoClient, db_name: str) -> Dict[str, List]:
    """
    Fetch training data from MongoDB

    Args:
        client: MongoClient instance
        db_name: Database name

    Returns:
        Dictionary containing training data
    """
    print(f"\n{'='*60}")
    print("FETCHING DATA FROM MONGODB")
    print(f"{'='*60}")

    db = client[db_name]

    # Fetch collections
    print("\nFetching collections...")

    # Users
    users = list(db.users.find({}))
    print(f"✓ Users: {len(users)}")

    # Products
    products = list(db.products.find({}))
    print(f"✓ Products: {len(products)}")

    # Orders
    orders = list(db.orders.find({}))
    print(f"✓ Orders: {len(orders)}")

    # Order Items
    order_items = list(db.orderitems.find({}))
    print(f"✓ Order Items: {len(order_items)}")

    # Lists (optional)
    lists = list(db.lists.find({}))
    print(f"✓ Shopping Lists: {len(lists)}")

    # List Items (optional)
    list_items = list(db.listitems.find({}))
    print(f"✓ List Items: {len(list_items)}")

    # Prepare data for training
    # Convert ObjectId to string for JSON serialization
    def convert_objectid(doc):
        if doc is None:
            return None
        doc['_id'] = str(doc['_id'])
        # Convert other ObjectId fields
        for key in ['userId', 'productId', 'orderId', 'listId']:
            if key in doc and doc[key]:
                doc[key] = str(doc[key])
        return doc

    # Convert all documents
    users = [convert_objectid(doc) for doc in users]
    products = [convert_objectid(doc) for doc in products]
    orders = [convert_objectid(doc) for doc in orders]
    order_items = [convert_objectid(doc) for doc in order_items]
    lists = [convert_objectid(doc) for doc in lists]
    list_items = [convert_objectid(doc) for doc in list_items]

    print(f"\n✓ Data fetching complete")
    print(f"{'='*60}")

    return {
        'users': users,
        'products': products,
        'orders': orders,
        'orderItems': order_items,
        'lists': lists,
        'listItems': list_items
    }


def train_model(data: Dict[str, List], data_path: str = './data') -> RecommendationEngine:
    """
    Train the recommendation model

    Args:
        data: Training data
        data_path: Path to store model

    Returns:
        Trained RecommendationEngine
    """
    print(f"\n{'='*60}")
    print("INITIALIZING RECOMMENDATION ENGINE")
    print(f"{'='*60}\n")

    # Initialize engine
    engine = RecommendationEngine(data_path=data_path)

    # Train model
    stats = engine.train(
        orders_data=data['orders'],
        products_data=data['products'],
        order_items_data=data['orderItems'],
        lists_data=data['lists']
    )

    return engine, stats


def evaluate_model(engine: RecommendationEngine, test_data: List[Dict]) -> Dict:
    """
    Evaluate model performance

    Args:
        engine: Trained recommendation engine
        test_data: Test data for evaluation

    Returns:
        Evaluation metrics
    """
    print(f"\n{'='*60}")
    print("EVALUATING MODEL")
    print(f"{'='*60}\n")

    if not test_data:
        print("⚠ No test data available for evaluation")
        return {}

    # Use last 20% of order items for testing
    test_size = max(1, len(test_data) // 5)
    test_set = test_data[-test_size:]

    print(f"Test set size: {len(test_set)} interactions")

    metrics = engine.evaluate_model(test_set)

    return metrics


def generate_sample_recommendations(engine: RecommendationEngine, data: Dict) -> None:
    """
    Generate sample recommendations to verify model works

    Args:
        engine: Trained recommendation engine
        data: Training data
    """
    print(f"\n{'='*60}")
    print("GENERATING SAMPLE RECOMMENDATIONS")
    print(f"{'='*60}\n")

    # Get a sample user
    users = data['users']
    if not users:
        print("⚠ No users available")
        return

    sample_user = users[0]
    user_id = sample_user['_id']
    user_name = sample_user.get('name', 'Unknown')

    print(f"Sample User: {user_name} (ID: {user_id})\n")

    # Get personalized recommendations
    print("1. Personalized Recommendations (Hybrid):")
    print("-" * 50)
    recommendations = engine.get_hybrid_recommendations(user_id, n=5)

    if recommendations:
        for i, rec in enumerate(recommendations, 1):
            print(f"  {i}. {rec.get('productName', 'Unknown Product')}")
            print(f"     Score: {rec['score']:.3f} | Confidence: {rec['confidence']:.2%}")
            print(f"     Reason: {rec.get('reason', 'N/A')}")
            print()
    else:
        print("  No recommendations available\n")

    # Get trending products
    print("\n2. Trending Products:")
    print("-" * 50)
    trending = engine.get_trending_products(n=5)

    if trending:
        for i, rec in enumerate(trending, 1):
            print(f"  {i}. {rec.get('productName', 'Unknown Product')}")
            print(f"     Popularity Score: {rec['score']:.3f}")
            print()
    else:
        print("  No trending products available\n")

    # Get related products (if products exist)
    products = data['products']
    if products:
        sample_product = products[0]
        product_id = sample_product['_id']
        product_name = sample_product.get('name', 'Unknown')

        print(f"\n3. Products Related to '{product_name}':")
        print("-" * 50)
        related = engine.get_related_products(product_id, n=5)

        if related:
            for i, rec in enumerate(related, 1):
                print(f"  {i}. {rec.get('productName', 'Unknown Product')}")
                print(f"     Similarity: {rec['score']:.3f}")
                print(f"     Reason: {rec.get('reason', 'N/A')}")
                print()
        else:
            print("  No related products available\n")


def save_training_report(stats: Dict, metrics: Dict, output_path: str = './training_report.json') -> None:
    """
    Save training report to file

    Args:
        stats: Training statistics
        metrics: Evaluation metrics
        output_path: Path to save report
    """
    report = {
        'training_date': datetime.now().isoformat(),
        'statistics': stats,
        'evaluation_metrics': metrics,
        'status': 'success'
    }

    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n✓ Training report saved to: {output_path}")


def main():
    """Main training function"""
    parser = argparse.ArgumentParser(description='Train IntelliCart ML Recommendation Models')
    parser.add_argument('--mongodb-uri', type=str, help='MongoDB connection URI')
    parser.add_argument('--db-name', type=str, default='intellicart', help='Database name')
    parser.add_argument('--data-path', type=str, default='./data', help='Path to store model')
    parser.add_argument('--model-name', type=str, default='recommendation_model.pkl', help='Model filename')
    parser.add_argument('--skip-evaluation', action='store_true', help='Skip model evaluation')
    parser.add_argument('--skip-samples', action='store_true', help='Skip sample recommendations')

    args = parser.parse_args()

    print("\n")
    print("="*60)
    print("  IntelliCart ML Model Training")
    print("  Advanced Recommendation System")
    print("="*60)
    print(f"\nStarted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Load environment variables
    load_dotenv()

    # Get MongoDB URI
    mongodb_uri = args.mongodb_uri or os.getenv('MONGODB_URI', 'mongodb://localhost:27017/intellicart')

    print(f"\nConfiguration:")
    print(f"  MongoDB URI: {mongodb_uri.split('@')[-1] if '@' in mongodb_uri else mongodb_uri}")
    print(f"  Database: {args.db_name}")
    print(f"  Data Path: {args.data_path}")
    print(f"  Model Name: {args.model_name}")

    # Create data directory
    os.makedirs(args.data_path, exist_ok=True)

    try:
        # Step 1: Connect to MongoDB
        client = connect_to_mongodb(mongodb_uri)

        # Step 2: Fetch data
        data = fetch_data_from_mongodb(client, args.db_name)

        # Check if we have enough data
        if len(data['orderItems']) < 10:
            print("\n⚠ WARNING: Very few order items found. Model may not perform well.")
            print("  Consider adding more sample data or seeding the database.")

        # Step 3: Train model
        engine, stats = train_model(data, args.data_path)

        # Step 4: Evaluate model
        metrics = {}
        if not args.skip_evaluation and data['orderItems']:
            metrics = evaluate_model(engine, data['orderItems'])

        # Step 5: Save model
        model_path = os.path.join(args.data_path, args.model_name)
        engine.save_model(model_path)

        # Step 6: Generate sample recommendations
        if not args.skip_samples:
            generate_sample_recommendations(engine, data)

        # Step 7: Save training report
        report_path = os.path.join(args.data_path, 'training_report.json')
        save_training_report(stats, metrics, report_path)

        # Summary
        print(f"\n{'='*60}")
        print("TRAINING SUMMARY")
        print(f"{'='*60}")
        print(f"\n✓ Model successfully trained and saved")
        print(f"  Location: {model_path}")
        print(f"  Users: {stats.get('num_users', 0)}")
        print(f"  Products: {stats.get('num_products', 0)}")
        print(f"  Interactions: {stats.get('num_interactions', 0)}")
        print(f"  Training Time: {stats.get('duration_seconds', 0):.2f}s")

        if metrics:
            print(f"\n  Model Accuracy: {metrics.get('accuracy', 0):.2%}")
            print(f"  Precision@10: {metrics.get('precision_at_10', 0):.2%}")

        print(f"\n{'='*60}")
        print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}\n")

        # Close MongoDB connection
        client.close()

        print("✓ Training completed successfully!")
        return 0

    except KeyboardInterrupt:
        print("\n\n✗ Training interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n✗ Training failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
