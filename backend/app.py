from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from flasgger import Swagger
import os

# Import routes
from routes.auth import auth_bp
from routes.queries import queries_bp
from routes.schema import schema_bp

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Simple and effective CORS configuration
CORS(app, 
     resources={
         r"/*": {  # Changed from r"/api/*" to r"/*" to handle all routes
             "origins": [
                 "https://sql-analytics-platform.onrender.com",
                 "http://localhost:80",
                 "http://localhost:5173",
                 "http://localhost:3000"
             ],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
             "supports_credentials": True,
             "expose_headers": ["Content-Type", "Authorization"]
         }
     })

# Comprehensive request/response logging
@app.before_request
def log_request():
    print("=" * 80)
    print(f"🔍 INCOMING REQUEST")
    print(f"Method: {request.method}")
    print(f"Path: {request.path}")
    print(f"Origin: {request.headers.get('Origin', 'NONE')}")
    print(f"User-Agent: {request.headers.get('User-Agent', 'NONE')}")
    print(f"Content-Type: {request.headers.get('Content-Type', 'NONE')}")
    print(f"All Headers:")
    for header, value in request.headers:
        print(f"  {header}: {value}")
    print("=" * 80)

@app.after_request
def log_response(response):
    print("=" * 80)
    print(f"📤 OUTGOING RESPONSE")
    print(f"Status: {response.status_code}")
    print(f"Content-Type: {response.content_type}")
    print(f"Response Headers:")
    for header, value in response.headers:
        print(f"  {header}: {value}")
    
    # Force add CORS headers manually as backup
    origin = request.headers.get('Origin')
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, Origin, X-Requested-With'
        print(f"🔧 MANUALLY ADDED CORS HEADERS for origin: {origin}")
    
    print("=" * 80)
    return response

# Manual OPTIONS handler as backup
@app.route('/api/auth/login', methods=['OPTIONS'])
def handle_login_options():
    print("🚀 MANUAL OPTIONS HANDLER TRIGGERED")
    response = jsonify({'message': 'OK'})
    origin = request.headers.get('Origin', '*')
    response.headers['Access-Control-Allow-Origin'] = origin
    response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, Origin, X-Requested-With'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Max-Age'] = '0'
    print(f"🔧 Manual OPTIONS response for origin: {origin}")
    return response

# Configure Swagger
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api-docs/",
}

swagger_template = {
    "info": {
        "title": "SQL Analytics Platform API",
        "description": "API documentation for SQL Analytics Platform",
        "version": "1.0.0",
    }
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

# Register blueprints with explicit URL prefixes
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(queries_bp, url_prefix="/api/queries")
app.register_blueprint(schema_bp, url_prefix="/api/schema")

# Root health check
@app.route("/", methods=["GET"])
def root_health_check():
    return jsonify({"status": "healthy", "message": "SQL Analytics API is running", "version": "1.0.0"}), 200

# Main health check endpoint for Render
@app.route('/health', methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "API is running"}), 200

# API health check endpoint  
@app.route('/api/health', methods=["GET"])
def api_health_check():
    return jsonify({"status": "healthy", "message": "API is running", "endpoints": ["/api/auth", "/api/queries", "/api/schema"]}), 200

# Debug endpoint to show all routes
@app.route('/api/routes', methods=["GET"])
def show_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'rule': str(rule)
        })
    return jsonify({"routes": routes}), 200

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Starting SQL Analytics Platform Backend on port {port}")
    print(f"📚 API Documentation available at: http://localhost:{port}/api-docs/")
    print(f"💚 Health check available at: http://localhost:{port}/api/health")
    app.run(host="0.0.0.0", port=port, debug=False)