import os
import sys
import logging
from supabase import create_client
from app.config import settings
from app.supabase import MOCK_DATA

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_supabase")

def seed():
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    if not url or not key:
        logger.error("Missing SUPABASE_URL or keys in .env")
        return

    logger.info(f"Connecting to Supabase at {url}...")
    sb = create_client(url, key)

    # 1. Seed Hospitals
    logger.info("Seeding hospitals...")
    for h in MOCK_DATA.get("hospitals", []):
        try:
            sb.table("hospitals").upsert({
                "name": h["name"],
                "type": h.get("type", "General Hospital"),
                "address": h["address"],
                "city": h["city"],
                "state": h["state"],
                "postal_code": h["postal_code"],
                "latitude": h["latitude"],
                "longitude": h["longitude"],
                "phone": h["phone"],
                "email": h.get("email"),
                "website": h.get("website"),
                "rating": h.get("rating", 4.5),
                "services": h.get("services", []),
                "emergency_available": h.get("emergency_available", True),
                "operational_hours": h.get("operational_hours", "24/7"),
                "image_url": h.get("image_url")
            }).execute()
        except Exception as e:
            logger.warning(f"Hospital {h['name']} notice: {e}")

    logger.info("Seeding completed successfully!")

if __name__ == "__main__":
    seed()
