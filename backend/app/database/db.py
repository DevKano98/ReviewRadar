

import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import settings


def get_connection():
    """
    Returns a new psycopg2 connection with RealDictCursor.
    
    RealDictCursor makes rows return as dicts automatically:
    - fetchone() returns dict or None
    - fetchall() returns list of dicts
    
    Usage:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
                row = cur.fetchone()  # returns dict
    """
    return psycopg2.connect(settings.DATABASE_URL, cursor_factory=RealDictCursor)


def test_connection() -> bool:
    """
    Test database connection on startup.
    
    Returns:
        True if connection successful, False otherwise
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False