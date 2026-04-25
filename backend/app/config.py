from dotenv import load_dotenv
load_dotenv()

import os
from typing import Optional


class Settings:
    """Application configuration loaded from environment variables."""
    
    # Required environment variables
    DATABASE_URL: str
    GEMINI_API_KEY: str
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    SCRAPERAPI_KEY: str
    
    # Optional configuration with defaults
    FAKE_THRESHOLD: float = 0.45
    CACHE_HOURS: int = 24
    MAX_REVIEWS: int = 90
    
    def __init__(self):
        """Load and validate all required environment variables."""
        missing_vars = []
        
        # Check all required variables
        self.DATABASE_URL = os.getenv("DATABASE_URL", "")
        if not self.DATABASE_URL:
            missing_vars.append("DATABASE_URL")
        
        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
        if not self.GEMINI_API_KEY:
            missing_vars.append("GEMINI_API_KEY")
        
        self.CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
        if not self.CLOUDINARY_CLOUD_NAME:
            missing_vars.append("CLOUDINARY_CLOUD_NAME")
        
        self.CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
        if not self.CLOUDINARY_API_KEY:
            missing_vars.append("CLOUDINARY_API_KEY")
        
        self.CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")
        if not self.CLOUDINARY_API_SECRET:
            missing_vars.append("CLOUDINARY_API_SECRET")
        
        self.SCRAPERAPI_KEY = os.getenv("SCRAPERAPI_KEY", "")
        if not self.SCRAPERAPI_KEY:
            missing_vars.append("SCRAPERAPI_KEY")
        
        # Raise error if any required variables are missing
        if missing_vars:
            raise RuntimeError(
                f"Missing required environment variables: {', '.join(missing_vars)}\n"
                f"Please create a .env file based on .env.example and fill in all values."
            )
        
        # Load optional config with defaults
        self.FAKE_THRESHOLD = float(os.getenv("FAKE_THRESHOLD", "0.60"))
        self.CACHE_HOURS = int(os.getenv("CACHE_HOURS", "24"))
        self.MAX_REVIEWS = int(os.getenv("MAX_REVIEWS", "90"))


# Create singleton settings instance
settings = Settings()