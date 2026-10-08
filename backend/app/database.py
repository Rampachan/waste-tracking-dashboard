import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

_raw_url = os.getenv("DATABASE_URL", "").strip()

# Strip any surrounding quotes
if (_raw_url.startswith('"') and _raw_url.endswith('"')) or (_raw_url.startswith("'") and _raw_url.endswith("'")):
    _raw_url = _raw_url[1:-1].strip()

# Force postgresql+psycopg2:// dialect so SQLAlchemy 2.0 uses psycopg2-binary
if _raw_url.startswith("postgres://"):
    _raw_url = _raw_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif _raw_url.startswith("postgresql://"):
    _raw_url = _raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# Validate URL parsing with SQLAlchemy make_url to prevent crash on invalid connection string
DATABASE_URL = None
if _raw_url:
    try:
        make_url(_raw_url)
        DATABASE_URL = _raw_url
    except Exception as e:
        print(f"WARNING: Unable to parse DATABASE_URL ('{_raw_url}'): {e}. Defaulting to SQLite.", file=sys.stderr)

if not DATABASE_URL:
    _DEFAULT_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "waste_management.db"))
    DATABASE_URL = f"sqlite:///{_DEFAULT_DB_PATH}"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
