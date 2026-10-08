import sys
import os

# Add project root directory to sys.path so backend module can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.main import app

# Vercel serverless function exports the FastAPI app directly
