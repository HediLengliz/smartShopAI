"""
IntelliCart ML Recommendation System
Collaborative Filtering & Content-Based Recommendations

This module implements a hybrid recommendation system that combines:
1. Collaborative Filtering (User-Based & Item-Based)
2. Content-Based Filtering
3. Popularity-Based Recommendations
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
import pickle
import os
from collections import defaultdict
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler
import warnings
warnings.filterwarnings('ignore')


class RecommendationEngine:
    """
    Advanced recommendation engine with multiple algorithms
    """

    def __init__(self, data_path: str = './data'):
        """
        Initialize the recommendation engine

        Args:
            data_path: Path to store data and models
        """
        self.data_path = data_path
        os.makedirs(data_path, exist_ok=True)

        # Model components
        self.user_item_matrix = None
        self.item_similarity_matrix = None
        self.user_similarity_matrix = None
        self.content_similarity_matrix = None
        self.product_features = None
        self.popularity_scores = None

        # Metadata
        self.users = []
        self.items = []
        self.item_metadata = {}
        self.user_metadata = {}

        # Scaler for normalization
        self.scaler = MinMaxScaler()

        # Model parameters
        self.min_interactions = 2
        self.similarity_threshold = 0.1

        print("[Recommendation Engine] Initialized")

    def load_data_from_mongo(self, orders_data: List[Dict], products_data: List[Dict],
                             lists_data: List[Dict] = None) -> None:
        """
        Load data from MongoDB collections

        Args:
            orders_data: List of order documents
            products_data: List of product documents
            lists_data: List of shopping list documents (optional)
        """
        print(f"[Data Loading] Loading {len(orders_data)} orders and {len(products_data)} products")

        # Convert to DataFrames
        self.orders_df = pd.DataFrame(orders_data)
        self.products_df = pd.DataFrame(products_data)

        if lists_data:
            self.lists_df = pd.DataFrame(lists_data)

        # Store product metadata
        for _, product in self.products_df.iterrows():
            self.item_metadata[product['_id']] = {
                'name': product.get('name', ''),
                'category': product.get('category', 'General'),
                'description': product.get('description', ''),
                'price': product.get('price', 0)
            }

        print(f"[Data Loading] Loaded {len(self.item_metadata)} products")

    def prepare_interaction_matrix(self, order_items_data: List[Dict]) -> None:
        """
        Prepare user-item interaction matrix from order items

        Args:
            order_items_data: List of order item documents
        """
        print("[Matrix Preparation] Building user-item interaction matrix...")

        # Create interactions DataFrame
        interactions = []
        for item in order_items_data:
            interactions.append({
                'user_id': item.get('userId'),
                'product_id': item.get('productId'),
                'quantity': item.get('quantity', 1),
                'price': item.get('priceAtPurchase', 0),
                'timestamp': item.get('createdAt', datetime.now())
            })

        if not interactions:
            print("[Matrix Preparation] No interactions found, using sample data")
            return

        interactions_df = pd.DataFrame(interactions)

        # Calculate interaction score (quantity * recency factor)
        interactions_df['days_ago'] = (
            datetime.now() - pd.to_datetime(interactions_df['timestamp'])
        ).dt.days
        interactions_df['recency_weight'] = np.exp(-interactions_df['days_ago'] / 30)
        interactions_df['score'] = (
            interactions_df['quantity'] * interactions_df['recency_weight']
        )

        # Aggregate by user and product
        agg_interactions = interactions_df.groupby(['user_id', 'product_id']).agg({
            'score': 'sum',
            'quantity': 'sum'
        }).reset_index()

        # Create pivot table
        self.user_item_matrix = agg_interactions.pivot_table(
            index='user_id',
            columns='product_id',
            values='score',
            fill_value=0
        )

        self.users = list(self.user_item_matrix.index)
        self.items = list(self.user_item_matrix.columns)

        print(f"[Matrix Preparation] Matrix shape: {self.user_item_matrix.shape}")
        print(f"[Matrix Preparation] Users: {len(self.users)}, Items: {len(self.items)}")

    def compute_item_similarity(self) -> None:
        """
        Compute item-to-item similarity matrix using cosine similarity
        """
        print("[Item Similarity] Computing item-item similarity matrix...")

        if self.user_item_matrix is None or self.user_item_matrix.shape[0] == 0:
            print("[Item Similarity] No interaction data available")
            return

        # Transpose to get item-user matrix
        item_user_matrix = self.user_item_matrix.T

        # Compute cosine similarity
        self.item_similarity_matrix = pd.DataFrame(
            cosine_similarity(item_user_matrix),
            index=self.items,
            columns=self.items
        )

        print(f"[Item Similarity] Computed similarity for {len(self.items)} items")

    def compute_user_similarity(self) -> None:
        """
        Compute user-to-user similarity matrix using cosine similarity
        """
        print("[User Similarity] Computing user-user similarity matrix...")

        if self.user_item_matrix is None or self.user_item_matrix.shape[0] == 0:
            print("[User Similarity] No interaction data available")
            return

        # Compute cosine similarity
        self.user_similarity_matrix = pd.DataFrame(
            cosine_similarity(self.user_item_matrix),
            index=self.users,
            columns=self.users
        )

        print(f"[User Similarity] Computed similarity for {len(self.users)} users")

    def compute_content_similarity(self) -> None:
        """
        Compute content-based similarity using product features
        """
        print("[Content Similarity] Computing content-based similarity...")

        if not self.item_metadata:
            print("[Content Similarity] No product metadata available")
            return

        # Create content features
        content_data = []
        for item_id in self.items:
            if item_id in self.item_metadata:
                meta = self.item_metadata[item_id]
                content_data.append({
                    'product_id': item_id,
                    'text': f"{meta['name']} {meta['category']} {meta['description']}"
                })

        content_df = pd.DataFrame(content_data)

        # TF-IDF vectorization
        tfidf = TfidfVectorizer(max_features=100, stop_words='english')
        tfidf_matrix = tfidf.fit_transform(content_df['text'])

        # Compute similarity
        content_similarity = cosine_similarity(tfidf_matrix)

        self.content_similarity_matrix = pd.DataFrame(
            content_similarity,
            index=content_df['product_id'],
            columns=content_df['product_id']
        )

        print(f"[Content Similarity] Computed for {len(content_df)} products")

    def compute_popularity_scores(self) -> None:
        """
        Compute popularity scores for products
        """
        print("[Popularity] Computing popularity scores...")

        if self.user_item_matrix is None or self.user_item_matrix.shape[0] == 0:
            print("[Popularity] No interaction data available")
            return

        # Sum interactions per item
        popularity = self.user_item_matrix.sum(axis=0)

        # Normalize scores
        max_score = popularity.max()
        if max_score > 0:
            self.popularity_scores = (popularity / max_score).to_dict()
        else:
            self.popularity_scores = {}

        print(f"[Popularity] Computed scores for {len(self.popularity_scores)} products")

    def train(self, orders_data: List[Dict], products_data: List[Dict],
              order_items_data: List[Dict], lists_data: List[Dict] = None) -> Dict:
        """
        Train all recommendation models

        Args:
            orders_data: Order documents
            products_data: Product documents
            order_items_data: Order item documents
            lists_data: Shopping list documents (optional)

        Returns:
            Training statistics
        """
        print("\n" + "="*60)
        print("TRAINING RECOMMENDATION MODELS")
        print("="*60 + "\n")

        start_time = datetime.now()

        # Load data
        self.load_data_from_mongo(orders_data, products_data, lists_data)

        # Prepare matrices
        self.prepare_interaction_matrix(order_items_data)

        # Train models
        self.compute_item_similarity()
        self.compute_user_similarity()
        self.compute_content_similarity()
        self.compute_popularity_scores()

        # Calculate statistics
        duration = (datetime.now() - start_time).total_seconds()

        stats = {
            'duration_seconds': duration,
            'num_users': len(self.users),
            'num_products': len(self.items),
            'num_interactions': len(order_items_data),
            'matrix_density': (
                self.user_item_matrix.values.sum() /
                (self.user_item_matrix.shape[0] * self.user_item_matrix.shape[1])
                if self.user_item_matrix is not None else 0
            ),
            'trained_at': datetime.now().isoformat()
        }

        print("\n" + "="*60)
        print("TRAINING COMPLETE")
        print("="*60)
        print(f"Duration: {duration:.2f} seconds")
        print(f"Users: {stats['num_users']}")
        print(f"Products: {stats['num_products']}")
        print(f"Interactions: {stats['num_interactions']}")
        print(f"Matrix Density: {stats['matrix_density']:.4f}")
        print("="*60 + "\n")

        return stats

    def get_collaborative_recommendations(self, user_id: str, n: int = 10) -> List[Tuple[str, float]]:
        """
        Get collaborative filtering recommendations for a user

        Args:
            user_id: User ID
            n: Number of recommendations

        Returns:
            List of (product_id, score) tuples
        """
        if self.item_similarity_matrix is None:
            return []

        if user_id not in self.users:
            return []

        # Get user's interactions
        user_interactions = self.user_item_matrix.loc[user_id]
        interacted_items = user_interactions[user_interactions > 0].index.tolist()

        if not interacted_items:
            return []

        # Calculate scores for all items
        scores = {}
        for item in self.items:
            if item in interacted_items:
                continue  # Skip already interacted items

            if item not in self.item_similarity_matrix.columns:
                continue

            # Weighted sum of similarities
            score = 0
            for interacted_item in interacted_items:
                if interacted_item in self.item_similarity_matrix.index:
                    similarity = self.item_similarity_matrix.loc[interacted_item, item]
                    interaction_strength = user_interactions[interacted_item]
                    score += similarity * interaction_strength

            scores[item] = score

        # Sort and return top N
        sorted_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_items[:n]

    def get_content_based_recommendations(self, user_id: str, n: int = 10) -> List[Tuple[str, float]]:
        """
        Get content-based recommendations for a user

        Args:
            user_id: User ID
            n: Number of recommendations

        Returns:
            List of (product_id, score) tuples
        """
        if self.content_similarity_matrix is None or user_id not in self.users:
            return []

        # Get user's interactions
        user_interactions = self.user_item_matrix.loc[user_id]
        interacted_items = user_interactions[user_interactions > 0].index.tolist()

        if not interacted_items:
            return []

        # Calculate content-based scores
        scores = {}
        for item in self.items:
            if item in interacted_items:
                continue

            if item not in self.content_similarity_matrix.columns:
                continue

            # Average similarity to interacted items
            similarities = []
            for interacted_item in interacted_items:
                if interacted_item in self.content_similarity_matrix.index:
                    sim = self.content_similarity_matrix.loc[interacted_item, item]
                    similarities.append(sim)

            if similarities:
                scores[item] = np.mean(similarities)

        # Sort and return top N
        sorted_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_items[:n]

    def get_hybrid_recommendations(self, user_id: str, n: int = 10,
                                   cf_weight: float = 0.5,
                                   content_weight: float = 0.3,
                                   popularity_weight: float = 0.2) -> List[Dict]:
        """
        Get hybrid recommendations combining multiple algorithms

        Args:
            user_id: User ID
            n: Number of recommendations
            cf_weight: Weight for collaborative filtering
            content_weight: Weight for content-based filtering
            popularity_weight: Weight for popularity

        Returns:
            List of recommendation dictionaries
        """
        # Get recommendations from each method
        cf_recs = dict(self.get_collaborative_recommendations(user_id, n * 3))
        content_recs = dict(self.get_content_based_recommendations(user_id, n * 3))

        # Combine scores
        all_items = set(cf_recs.keys()) | set(content_recs.keys())

        # Get user's already interacted items
        interacted_items = set()
        if user_id in self.users:
            user_interactions = self.user_item_matrix.loc[user_id]
            interacted_items = set(user_interactions[user_interactions > 0].index)

        hybrid_scores = {}
        for item in all_items:
            if item in interacted_items:
                continue

            score = 0

            # Collaborative filtering score
            if item in cf_recs:
                cf_score = cf_recs[item]
                score += cf_weight * cf_score

            # Content-based score
            if item in content_recs:
                content_score = content_recs[item]
                score += content_weight * content_score

            # Popularity score
            if self.popularity_scores and item in self.popularity_scores:
                pop_score = self.popularity_scores[item]
                score += popularity_weight * pop_score

            hybrid_scores[item] = score

        # Sort by score
        sorted_items = sorted(hybrid_scores.items(), key=lambda x: x[1], reverse=True)

        # Format results
        recommendations = []
        for item_id, score in sorted_items[:n]:
            rec = {
                'productId': str(item_id),
                'score': float(score),
                'confidence': min(float(score), 1.0)
            }

            # Add metadata if available
            if item_id in self.item_metadata:
                meta = self.item_metadata[item_id]
                rec['productName'] = meta['name']
                rec['category'] = meta['category']
                rec['price'] = meta['price']
                rec['reason'] = self._generate_reason(user_id, item_id, cf_recs, content_recs)

            recommendations.append(rec)

        return recommendations

    def _generate_reason(self, user_id: str, item_id: str,
                        cf_recs: Dict, content_recs: Dict) -> str:
        """Generate explanation for recommendation"""
        reasons = []

        if item_id in cf_recs:
            reasons.append("Based on your shopping history")

        if item_id in content_recs:
            if item_id in self.item_metadata:
                category = self.item_metadata[item_id]['category']
                reasons.append(f"Similar to items you like in {category}")

        if self.popularity_scores and item_id in self.popularity_scores:
            if self.popularity_scores[item_id] > 0.7:
                reasons.append("Popular with other shoppers")

        return " • ".join(reasons) if reasons else "Recommended for you"

    def get_trending_products(self, n: int = 10, days: int = 30) -> List[Dict]:
        """
        Get trending products based on recent popularity

        Args:
            n: Number of products
            days: Time window in days

        Returns:
            List of trending product recommendations
        """
        if not self.popularity_scores:
            return []

        # Sort by popularity
        sorted_products = sorted(
            self.popularity_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )

        # Format results
        trending = []
        for item_id, score in sorted_products[:n]:
            rec = {
                'productId': str(item_id),
                'score': float(score),
                'reason': 'Trending now',
                'confidence': min(float(score), 1.0)
            }

            if item_id in self.item_metadata:
                meta = self.item_metadata[item_id]
                rec['productName'] = meta['name']
                rec['category'] = meta['category']
                rec['price'] = meta['price']

            trending.append(rec)

        return trending

    def get_related_products(self, product_id: str, n: int = 10) -> List[Dict]:
        """
        Get products related to a specific product

        Args:
            product_id: Product ID
            n: Number of recommendations

        Returns:
            List of related product recommendations
        """
        related = []

        # Try item similarity first
        if (self.item_similarity_matrix is not None and
            product_id in self.item_similarity_matrix.index):

            similarities = self.item_similarity_matrix.loc[product_id]
            similarities = similarities[similarities.index != product_id]
            top_similar = similarities.nlargest(n)

            for item_id, similarity in top_similar.items():
                rec = {
                    'productId': str(item_id),
                    'score': float(similarity),
                    'confidence': float(similarity),
                    'reason': 'Frequently bought together'
                }

                if item_id in self.item_metadata:
                    meta = self.item_metadata[item_id]
                    rec['productName'] = meta['name']
                    rec['category'] = meta['category']
                    rec['price'] = meta['price']

                related.append(rec)

        # Fallback to content similarity
        if (not related and self.content_similarity_matrix is not None and
            product_id in self.content_similarity_matrix.index):

            similarities = self.content_similarity_matrix.loc[product_id]
            similarities = similarities[similarities.index != product_id]
            top_similar = similarities.nlargest(n)

            for item_id, similarity in top_similar.items():
                rec = {
                    'productId': str(item_id),
                    'score': float(similarity),
                    'confidence': float(similarity),
                    'reason': f'Similar to this product'
                }

                if item_id in self.item_metadata:
                    meta = self.item_metadata[item_id]
                    rec['productName'] = meta['name']
                    rec['category'] = meta['category']
                    rec['price'] = meta['price']

                related.append(rec)

        return related[:n]

    def save_model(self, filepath: str = None) -> str:
        """
        Save trained model to disk

        Args:
            filepath: Path to save model

        Returns:
            Path where model was saved
        """
        if filepath is None:
            filepath = os.path.join(self.data_path, 'recommendation_model.pkl')

        model_data = {
            'user_item_matrix': self.user_item_matrix,
            'item_similarity_matrix': self.item_similarity_matrix,
            'user_similarity_matrix': self.user_similarity_matrix,
            'content_similarity_matrix': self.content_similarity_matrix,
            'popularity_scores': self.popularity_scores,
            'users': self.users,
            'items': self.items,
            'item_metadata': self.item_metadata,
            'user_metadata': self.user_metadata,
            'trained_at': datetime.now().isoformat()
        }

        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)

        print(f"[Model Save] Model saved to {filepath}")
        return filepath

    def load_model(self, filepath: str = None) -> bool:
        """
        Load trained model from disk

        Args:
            filepath: Path to load model from

        Returns:
            True if successful, False otherwise
        """
        if filepath is None:
            filepath = os.path.join(self.data_path, 'recommendation_model.pkl')

        if not os.path.exists(filepath):
            print(f"[Model Load] Model file not found: {filepath}")
            return False

        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)

            self.user_item_matrix = model_data['user_item_matrix']
            self.item_similarity_matrix = model_data['item_similarity_matrix']
            self.user_similarity_matrix = model_data['user_similarity_matrix']
            self.content_similarity_matrix = model_data['content_similarity_matrix']
            self.popularity_scores = model_data['popularity_scores']
            self.users = model_data['users']
            self.items = model_data['items']
            self.item_metadata = model_data['item_metadata']
            self.user_metadata = model_data['user_metadata']

            print(f"[Model Load] Model loaded from {filepath}")
            print(f"[Model Load] Trained at: {model_data.get('trained_at', 'Unknown')}")
            print(f"[Model Load] Users: {len(self.users)}, Items: {len(self.items)}")

            return True
        except Exception as e:
            print(f"[Model Load] Error loading model: {str(e)}")
            return False

    def evaluate_model(self, test_data: List[Dict]) -> Dict:
        """
        Evaluate model performance on test data

        Args:
            test_data: Test order items

        Returns:
            Evaluation metrics
        """
        print("\n[Evaluation] Evaluating model performance...")

        if not test_data:
            return {'error': 'No test data provided'}

        # Calculate metrics
        total_recommendations = 0
        successful_recommendations = 0

        for item in test_data:
            user_id = item.get('userId')
            actual_product = item.get('productId')

            if user_id in self.users:
                recommendations = self.get_hybrid_recommendations(user_id, n=10)
                recommended_products = [r['productId'] for r in recommendations]

                total_recommendations += 1
                if str(actual_product) in recommended_products:
                    successful_recommendations += 1

        accuracy = (
            successful_recommendations / total_recommendations
            if total_recommendations > 0 else 0
        )

        metrics = {
            'accuracy': accuracy,
            'precision_at_10': accuracy,
            'total_predictions': total_recommendations,
            'successful_predictions': successful_recommendations
        }

        print(f"[Evaluation] Accuracy: {accuracy:.2%}")
        print(f"[Evaluation] Successful: {successful_recommendations}/{total_recommendations}")

        return metrics


if __name__ == "__main__":
    print("IntelliCart Recommendation Engine")
    print("="*60)
    print("This module provides ML-based product recommendations")
    print("Import and use in your application:")
    print("  from recommendation_model import RecommendationEngine")
    print("="*60)
