from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)

# Get DATABASE_URL from environment - MUST be set on Vercel via project settings
_raw_url = os.getenv("DATABASE_URL", "").strip()

if not _raw_url:
    # On Vercel, DATABASE_URL will be empty if not configured in project settings
    logger.error("❌ CRITICAL: DATABASE_URL environment variable is not set!")
    logger.error("On Vercel: Go to Project Settings > Environment Variables > Add DATABASE_URL")
    logger.error("Format: postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require")
    # Still create engine to avoid crashing at import time - it will fail at first use
    _raw_url = "postgresql://localhost/dummy"
else:
    # Handle postgres:// vs postgresql://
    if _raw_url.startswith("postgres://"):
        _raw_url = "postgresql://" + _raw_url.split("://", 1)[-1]
    # Supabase requires SSL
    if "supabase" in _raw_url.lower() and "sslmode" not in _raw_url:
        _raw_url += "?sslmode=require" if "?" not in _raw_url else "&sslmode=require"
    logger.info(f"DATABASE_URL configured: {_raw_url.split('@')[0]}@[hidden]")

DATABASE_URL = _raw_url

# Connection args for SSL
_connect_args = {}
if "sslmode=require" in DATABASE_URL or os.getenv("DATABASE_SSL") == "true":
    _connect_args["sslmode"] = "require"

# Pool size is configurable via env vars since the right value differs by
# deployment target: on Vercel serverless, each function instance holds its
# own small pool (rely on Neon's pooler endpoint for the real concurrency
# limit); on a long-running server, a larger in-process pool is appropriate.
# Defaults keep today's behavior; raise via env vars as real traffic grows.
_pool_size = int(os.getenv("DB_POOL_SIZE", "5"))
_max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "10"))
_pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", "30"))
_pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "1800"))  # recycle idle connections every 30 min

# Create engine - this is lazy, won't actually connect until first use
engine = create_engine(
    DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,
    pool_size=_pool_size,
    max_overflow=_max_overflow,
    pool_timeout=_pool_timeout,
    pool_recycle=_pool_recycle,
    echo=False,  # Set to True for SQL debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ──────────────────────────────────────────────────────────────────────────
# Read replica support — not provisioned yet (no replica exists at current
# scale), but the routing code is ready for when REPLICA_DATABASE_URL is set
# on a paid Neon tier. Until then, replica_engine == engine and get_db_read
# behaves identically to get_db, so nothing changes for existing callers.
# ──────────────────────────────────────────────────────────────────────────
_replica_url = os.getenv("REPLICA_DATABASE_URL", "").strip()
if _replica_url:
    if _replica_url.startswith("postgres://"):
        _replica_url = "postgresql://" + _replica_url.split("://", 1)[-1]
    replica_engine = create_engine(
        _replica_url,
        connect_args=_connect_args,
        pool_pre_ping=True,
        pool_size=_pool_size,
        max_overflow=_max_overflow,
        pool_timeout=_pool_timeout,
        pool_recycle=_pool_recycle,
        echo=False,
    )
    logger.info("Read replica configured — read-heavy queries can route to REPLICA_DATABASE_URL")
else:
    replica_engine = engine  # no replica provisioned — reads go to primary, same as today

ReplicaSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=replica_engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_read():
    """
    Use for read-heavy endpoints that can tolerate replica lag (e.g. admin
    aggregate stats, dashboard reads) once a real replica is provisioned.
    Falls back to the primary automatically when no replica is configured,
    so it's safe to adopt in new endpoints before a replica exists.
    """
    db = ReplicaSessionLocal()
    try:
        yield db
    finally:
        db.close()
