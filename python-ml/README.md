# 🤖 IntelliCart ML Recommendation System

Advanced Machine Learning recommendation engine for personalized product suggestions.

## 📋 Overview

This ML system provides:

- ✅ **Collaborative Filtering** - User-based and item-based recommendations
- ✅ **Content-Based Filtering** - Recommendations based on product features
- ✅ **Hybrid Recommendations** - Combines multiple algorithms for best results
- ✅ **Popularity-Based** - Trending products across all users
- ✅ **Real-time API** - Flask REST API for serving recommendations
- ✅ **Model Training** - Automated training from MongoDB data

---

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
# Navigate to python-ml directory
cd python-ml

# Install requirements
pip install -r requirements.txt
```

### 2. Train the Model

```bash
# Train model from MongoDB data
python train.py --mongodb-uri "mongodb://localhost:27017" --db-name "intellicart"
```

### 3. Start the API Server

```bash
# Start Flask API server
python api_server.py
```

The API will be available at: **http://localhost:5001**

---

## 📦 Requirements

Create `requirements.txt`:

```txt
flask==3.0.0
flask-cors==4.0.0
numpy==1.24.3
pandas==2.0.3
scikit-learn==1.3.0
pymongo==4.5.0
python-dotenv==1.0.0
```

Install with:
```bash
pip install -r requirements.txt
```

---

## 🔧 Installation Guide

### Step 1: Python Environment

**Option A: Using venv (Recommended)**
```bash
cd IntelliCart/python-ml

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Option B: Using Conda**
```bash
conda create -n intellicart python=3.10
conda activate intellicart
pip install -r requirements.txt
```

### Step 2: Environment Variables

Create `.env` file in `python-ml` directory:

```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=intellicart
MODEL_PATH=./data/recommendation_model.pkl
ML_API_PORT=5001
FLASK_ENV=development
```

### Step 3: Create Data Directory

```bash
mkdir data
```

---

## 🎓 Training the Model

### Basic Training

```bash
python train.py
```

### Advanced Training Options

```bash
# Specify MongoDB URI
python train.py --mongodb-uri "mongodb://localhost:27017"

# Specify database name
python train.py --db-name "intellicart"

# Custom model output path
python train.py --data-path "./models" --model-name "my_model.pkl"

# Skip evaluation (faster training)
python train.py --skip-evaluation

# Skip sample recommendations
python train.py --skip-samples
```

### What Happens During Training?

1. **Connects to MongoDB** - Fetches orders, products, order items
2. **Prepares Data** - Creates user-item interaction matrix
3. **Trains Models**:
   - Item-to-item similarity (collaborative filtering)
   - User-to-user similarity (collaborative filtering)
   - Content-based similarity (product features)
   - Popularity scores
4. **Evaluates Performance** - Tests accuracy on held-out data
5. **Saves Model** - Stores trained model to disk
6. **Generates Report** - Creates `training_report.json`

### Expected Output

```
==============================================================
TRAINING RECOMMENDATION MODELS
==============================================================

[Data Loading] Loading 50 orders and 20 products
[Matrix Preparation] Building user-item interaction matrix...
[Matrix Preparation] Matrix shape: (10, 15)
[Item Similarity] Computing item-item similarity matrix...
[User Similarity] Computing user-user similarity matrix...
[Content Similarity] Computing content-based similarity...
[Popularity] Computing popularity scores...

==============================================================
TRAINING COMPLETE
==============================================================
Duration: 2.35 seconds
Users: 10
Products: 15
Interactions: 50
Matrix Density: 0.3333
==============================================================

✓ Model successfully trained and saved
```

---

## 🌐 Running the API Server

### Start Server

```bash
python api_server.py
```

Server runs on: **http://localhost:5001**

### Server Configuration

Environment variables:
```env
ML_API_PORT=5001          # Port to run on
FLASK_ENV=development     # development or production
MODEL_PATH=./data/recommendation_model.pkl
```

### Health Check

```bash
curl http://localhost:5001/health
```

Response:
```json
{
  "status": "healthy",
  "service": "IntelliCart ML Recommendation API",
  "timestamp": "2024-01-15T10:30:00",
  "model_loaded": true
}
```

---

## 📡 API Endpoints

### 1. Get Personalized Recommendations

**POST** `/api/ml/recommendations/personalized`

```bash
curl -X POST http://localhost:5001/api/ml/recommendations/personalized \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "68f39b143974c2923f2692bc",
    "limit": 10,
    "cfWeight": 0.5,
    "contentWeight": 0.3,
    "popularityWeight": 0.2
  }'
```

Response:
```json
{
  "success": true,
  "userId": "68f39b143974c2923f2692bc",
  "recommendations": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "productName": "Organic Apples",
      "category": "Fruits",
      "price": 3.99,
      "score": 0.85,
      "confidence": 0.85,
      "reason": "Based on your shopping history • Popular with other shoppers"
    }
  ],
  "count": 10
}
```

### 2. Get Trending Products

**GET** `/api/ml/recommendations/trending?limit=10&days=30`

```bash
curl http://localhost:5001/api/ml/recommendations/trending?limit=10
```

### 3. Get Related Products

**GET** `/api/ml/recommendations/related/:productId?limit=10`

```bash
curl http://localhost:5001/api/ml/recommendations/related/507f1f77bcf86cd799439011
```

### 4. Train Model via API

**POST** `/api/ml/train`

```bash
curl -X POST http://localhost:5001/api/ml/train \
  -H "Content-Type: application/json" \
  -d '{
    "orders": [...],
    "products": [...],
    "orderItems": [...]
  }'
```

### 5. Get Model Info

**GET** `/api/ml/model/info`

```bash
curl http://localhost:5001/api/ml/model/info
```

### 6. Get Statistics

**GET** `/api/ml/stats`

```bash
curl http://localhost:5001/api/ml/stats
```

### 7. Reload Model

**POST** `/api/ml/reload`

```bash
curl -X POST http://localhost:5001/api/ml/reload
```

---

## 🔗 Integration with Node.js Backend

### Update Node.js AI Service

Edit `server/services/ai-agents.ts`:

```typescript
// Add ML API endpoint
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001';

async getPersonalizedRecommendations(userId: string, limit: number = 4) {
  try {
    // Call Python ML API
    const response = await fetch(`${ML_API_URL}/api/ml/recommendations/personalized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, limit })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { products: data.recommendations };
    }
    
    // Fallback to mock implementation
    return this.getMockRecommendations(userId, limit);
  } catch (error) {
    console.error('[ML Integration] Error:', error);
    return this.getMockRecommendations(userId, limit);
  }
}
```

### Add Environment Variable

In `.env`:
```env
ML_API_URL=http://localhost:5001
```

---

## 📊 Model Performance

### Accuracy Metrics

- **Precision@10**: How many recommended items are relevant
- **Recall**: How many relevant items are recommended
- **Matrix Density**: Sparsity of user-item interactions

### Expected Performance

| Metric | Value | Description |
|--------|-------|-------------|
| Accuracy | 65-85% | Overall recommendation accuracy |
| Precision@10 | 60-80% | Accuracy for top 10 recommendations |
| Training Time | 2-5s | For 50-100 orders |
| Inference Time | <100ms | Single recommendation request |

### Improving Accuracy

1. **More Data** - Add more orders and interactions
2. **Feature Engineering** - Add product attributes (brand, tags, etc.)
3. **Hyperparameter Tuning** - Adjust weights (cfWeight, contentWeight)
4. **Time Decay** - Give recent interactions more weight (already implemented)
5. **Category Filtering** - Filter by user's preferred categories

---

## 🧪 Testing

### Test API Locally

```bash
# Test health endpoint
curl http://localhost:5001/health

# Test recommendations (replace USER_ID)
curl -X POST http://localhost:5001/api/ml/recommendations/personalized \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID", "limit": 5}'

# Test trending
curl http://localhost:5001/api/ml/recommendations/trending?limit=5
```

### Test Training

```bash
# Train with verbose output
python train.py

# Check training report
cat data/training_report.json
```

### Test Model Loading

```python
from recommendation_model import RecommendationEngine

# Load model
engine = RecommendationEngine(data_path='./data')
success = engine.load_model()

print(f"Model loaded: {success}")
print(f"Users: {len(engine.users)}")
print(f"Products: {len(engine.items)}")
```

---

## 🐛 Troubleshooting

### Issue: "Model not trained yet"

**Cause**: No trained model found

**Solution**:
```bash
# Train the model first
python train.py
```

### Issue: "No interactions found"

**Cause**: No order items in database

**Solution**:
```bash
# Seed database from Node.js app
cd ..
npm run db:seed
cd python-ml
python train.py
```

### Issue: "ModuleNotFoundError"

**Cause**: Missing Python dependencies

**Solution**:
```bash
pip install -r requirements.txt
```

### Issue: "MongoDB connection failed"

**Cause**: MongoDB not running or wrong URI

**Solution**:
```bash
# Start MongoDB
net start MongoDB  # Windows
sudo systemctl start mongod  # Linux

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017
```

### Issue: API returns empty recommendations

**Cause**: User has no interactions or model not trained on user

**Solution**:
- Ensure user has placed orders
- Retrain model with latest data
- Check user ID matches database

### Issue: Low accuracy

**Cause**: Insufficient training data

**Solution**:
- Add more orders to database
- Seed more diverse products
- Increase user interactions
- Adjust algorithm weights

---

## 🔄 Retraining Schedule

### When to Retrain?

- **New Products Added** - Add new products to recommendations
- **New Orders Placed** - Include latest user behavior
- **Weekly/Monthly** - Regular retraining for production

### Automated Retraining

Create cron job (Linux/Mac):
```bash
# Add to crontab
0 2 * * * cd /path/to/python-ml && python train.py
```

Windows Task Scheduler:
```bash
# Create batch script: retrain.bat
cd C:\path\to\python-ml
python train.py
```

### Training via API

```bash
# Trigger retraining from Node.js
curl -X POST http://localhost:5001/api/ml/train \
  -H "Content-Type: application/json" \
  -d @training_data.json
```

---

## 📈 Monitoring

### Check Model Status

```bash
curl http://localhost:5001/api/ml/model/info
```

### View Statistics

```bash
curl http://localhost:5001/api/ml/stats
```

### Log Files

Server logs show:
- Requests received
- Recommendation generation
- Errors and warnings

---

## 🚀 Production Deployment

### 1. Use Production WSGI Server

Install Gunicorn:
```bash
pip install gunicorn
```

Run with Gunicorn:
```bash
gunicorn -w 4 -b 0.0.0.0:5001 api_server:app
```

### 2. Environment Variables

```env
FLASK_ENV=production
ML_API_PORT=5001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/intellicart
MODEL_PATH=/var/models/recommendation_model.pkl
```

### 3. Process Manager

Use PM2 or systemd:

**PM2:**
```bash
pm2 start api_server.py --name intellicart-ml --interpreter python3
```

**Systemd:**
Create `/etc/systemd/system/intellicart-ml.service`:
```ini
[Unit]
Description=IntelliCart ML API
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/python-ml
ExecStart=/usr/bin/python3 api_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### 4. Nginx Reverse Proxy

```nginx
location /api/ml/ {
    proxy_pass http://localhost:5001/api/ml/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## 📚 Algorithm Details

### Collaborative Filtering

- **Item-Based**: Products similar to what user liked
- **User-Based**: Products liked by similar users
- **Similarity Metric**: Cosine similarity
- **Weighting**: Recency-weighted interactions

### Content-Based Filtering

- **Features**: Product name, category, description
- **Vectorization**: TF-IDF (Term Frequency-Inverse Document Frequency)
- **Similarity**: Cosine similarity on TF-IDF vectors

### Hybrid Approach

```
Final Score = (0.5 × CF Score) + (0.3 × Content Score) + (0.2 × Popularity Score)
```

Weights are adjustable per request.

---

## 🎯 Future Improvements

- [ ] Deep Learning (Neural Collaborative Filtering)
- [ ] Real-time model updates (online learning)
- [ ] A/B testing framework
- [ ] Multi-armed bandit algorithms
- [ ] Context-aware recommendations (time, location)
- [ ] Cross-sell and bundle recommendations
- [ ] GPU acceleration for large datasets
- [ ] Distributed training with Spark

---

## 📞 Support

### Logs Location

- Training logs: Console output during `train.py`
- API logs: Console output during `api_server.py`
- Training report: `./data/training_report.json`

### Common Commands

```bash
# Activate environment
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Train model
python train.py

# Start API
python api_server.py

# Test API
curl http://localhost:5001/health

# Check model
python -c "from recommendation_model import RecommendationEngine; e = RecommendationEngine(); print(e.load_model())"
```

---

## ✅ Checklist

Before deploying:

- [ ] Python dependencies installed
- [ ] MongoDB accessible
- [ ] Model trained successfully
- [ ] API server starts without errors
- [ ] Health endpoint responds
- [ ] Test recommendations return results
- [ ] Node.js integration configured
- [ ] Environment variables set

---

**IntelliCart ML System v1.0**  
**Advanced Recommendation Engine**  
Built with ❤️ using Python, scikit-learn, and Flask