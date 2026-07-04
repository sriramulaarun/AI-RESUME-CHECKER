import os
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-129384')
    
    # If DATABASE_URL is provided, use it. Otherwise, default to local SQLite.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///resumes.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload folder configuration
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB upload limit
