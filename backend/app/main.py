"""
ReviewRadar FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import scrape_routes, product_routes, analyze_routes
import cloudinary
from app.config import settings

app = FastAPI(
    title="ReviewRadar API",
    version="1.0.0",
    description="AI-powered fake review detector for Amazon and Flipkart"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(scrape_routes.router)
app.include_router(product_routes.router)
app.include_router(analyze_routes.router)


@app.on_event("startup")
async def startup():
    """Initialize services on application startup."""
    print("\n" + "="*60)
    print("ReviewRadar API Starting...")
    print("="*60)
    
    # Configure Cloudinary
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )
    print("✓ Cloudinary configured")
    
    # Test database connection
    from app.database.db import test_connection
    db_ok = test_connection()
    if db_ok:
        print("✓ Neon DB connected")
    else:
        print("❌ Neon DB connection FAILED — check DATABASE_URL")
    
    # Check ML model
    from app.ml.classifier import model
    if model is not None:
        print("✓ ML model loaded")
    else:
        print("⚠ ML model NOT LOADED - run: python -m app.ml.train_model")
    
    print("="*60)
    print(f"API running at http://localhost:8000")
    print(f"Docs available at http://localhost:8000/docs")
    print("="*60 + "\n")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "ReviewRadar API",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "scrape_stream": "/scrape/stream?url=<PRODUCT_URL>",
            "analyze_review": "/analyze/review",
            "product_check": "/product/check?url=<URL>",
            "recent_searches": "/product/recent"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    from app.ml.classifier import model
    from app.database.db import test_connection
    
    return {
        "status": "ok",
        "version": "1.0.0",
        "ml_loaded": model is not None,
        "db_connected": test_connection(),
    }