from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
from flasgger import Swagger
import os
from datetime import timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Import routes
from routes.auth import auth_bp
from routes.queries import queries_bp
from routes.schema import schema_bp

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS with explicit origins for both development and production
allowed_origins = [
    "http://localhost:3000",  # Development frontend
    "http://127.0.0.1:3000",  # Development frontend alternative
    "http://localhost:5000",  # Development backend
    "http://127.0.0.1:5000",  # Development backend alternative
    "http://15.207.114.204:3000"  # Production
]

logger.info(f"Configuring CORS with allowed origins: {allowed_origins}")

# Configure CORS
CORS(app, 
     resources={r"/api/*": {
         "origins": allowed_origins,
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
         "expose_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True,
         "max_age": 3600
     }})

# Add request logging middleware
@app.before_request
def log_request_info():
    logger.debug('Headers: %s', request.headers)
    logger.debug('Body: %s', request.get_data())
    logger.debug('Origin: %s', request.headers.get('Origin'))
    logger.debug('Method: %s', request.method)

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    if origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, Origin, X-Requested-With'
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

# Debug endpoint to show all routes (useful for troubleshooting)
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
    app.run(host="0.0.0.0", port=port, debug=True)