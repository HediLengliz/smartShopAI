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

# Import recommendation engine
from recommendation_model import RecommendationEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize recommendation engine
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
