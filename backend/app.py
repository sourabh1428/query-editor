from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
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
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"])

# Configure JWT
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "your-secret-key")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 60 * 60 * 24  # 1 day
jwt = JWTManager(app)

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
    },
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        }
    },
    "security": [{"Bearer": []}],
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(queries_bp, url_prefix="/api/queries")
app.register_blueprint(schema_bp, url_prefix="/api/schema")

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "SQL Analytics API is running"})

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)