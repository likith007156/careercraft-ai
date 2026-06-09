import os
import sys

# Add the parent directory of backend to sys.path to ensure backend imports work correctly
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException

# Load environments
load_dotenv()

# Import Blueprints
from backend.routes.dashboard import dashboard_bp
from backend.routes.learning import learning_bp
from backend.routes.quiz import quiz_bp
from backend.routes.interview import interview_bp
from backend.routes.communication import communication_bp
from backend.routes.progress import progress_bp

from backend.limiter import limiter

# Initialize DB connection on start
from backend.models.database import init_db
try:
    init_db()
except Exception as e:
    print(f"Failed to auto-verify database status: {e}")

app = Flask(__name__)
# Configure CORS to restrict allowed origins instead of wildcard '*'
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "https://careercraft-ai-flax.vercel.app,http://localhost:5173,http://127.0.0.1:5173"
).split(",")
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# Initialize rate limiting
limiter.init_app(app)

@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Root endpoint
@app.route('/')
def index():
    return jsonify({
        "status": "online",
        "message": "CareerCraft AI Backend API is active",
        "version": "1.0.0"
    })

# Register blueprints
app.register_blueprint(dashboard_bp)
app.register_blueprint(learning_bp)
app.register_blueprint(quiz_bp)
app.register_blueprint(interview_bp)
app.register_blueprint(communication_bp)
app.register_blueprint(progress_bp)

@app.errorhandler(Exception)
def handle_error(e):
    code = 500
    if isinstance(e, HTTPException):
        code = e.code
    return jsonify({
        "error": "Something went wrong" if code == 500 else e.name,
        "message": str(e.description) if isinstance(e, HTTPException) else str(e)
    }), code

if __name__ == "__main__":
    debug = os.getenv("FLASK_ENV") == "development"
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=debug)

