from flask import Flask, request, jsonify
from flask_cors import CORS
from codeanalysis import CodeAnalysisAgent
import os

app = Flask(__name__)
CORS(app)

# Initialize the AI agent
agent = CodeAnalysisAgent(model_dir="models")
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "message": "AI Agent API running. Use POST /analyze with JSON {\"code\":\"...\"} or POST /predict-language. GET /health for status."
    }), 200

@app.route('/analyze-info', methods=['GET'])
def analyze_info():
    return jsonify({
        "usage": "Send a POST request with Content-Type: application/json and body {'code': 'your code here'} to /analyze"
    }), 200
@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Endpoint to analyze code snippets.
    Expected JSON payload: {"code": "your code here"}
    Returns: JSON with analysis results
    """
    try:
        data = request.get_json()

        if not data or 'code' not in data:
            return jsonify({
                "error": "Missing 'code' field in request body"
            }), 400

        code_snippet = data['code']

        if not code_snippet or not code_snippet.strip():
            return jsonify({
                "error": "Code snippet cannot be empty"
            }), 400

        # Analyze the code using the AI agent
        analysis_result = agent.analyze_code(code_snippet)

        return jsonify(analysis_result), 200

    except Exception as e:
        return jsonify({
            "error": f"An error occurred during analysis: {str(e)}"
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """
    Health check endpoint
    """
    return jsonify({
        "status": "healthy",
        "message": "AI Agent API is running"
    }), 200

@app.route('/predict-language', methods=['POST'])
def predict_language():
    """
    Endpoint to predict programming language only.
    Expected JSON payload: {"code": "your code here"}
    Returns: JSON with predicted language
    """
    try:
        data = request.get_json()

        if not data or 'code' not in data:
            return jsonify({
                "error": "Missing 'code' field in request body"
            }), 400

        code_snippet = data['code']

        if not code_snippet or not code_snippet.strip():
            return jsonify({
                "error": "Code snippet cannot be empty"
            }), 400

        # Predict language using the AI agent
        predicted_language = agent.predict(code_snippet)

        return jsonify({
            "predicted_language": predicted_language
        }), 200

    except Exception as e:
        return jsonify({
            "error": f"An error occurred during prediction: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Check if model is loaded
    if not agent.model or not agent.vectorizer:
        print("⚠️ WARNING: Model not loaded. Please run ai-train.py first.")
        print("⚠️ API will start but requests will fail.")

    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5001))

    print(f"🚀 Starting AI Agent API on port {port}...")
    print(f"📍 Endpoints available:")
    print(f"   - POST http://localhost:{port}/analyze")
    print(f"   - POST http://localhost:{port}/predict-language")
    print(f"   - GET  http://localhost:{port}/health")

    app.run(host='0.0.0.0', port=port, debug=True)
