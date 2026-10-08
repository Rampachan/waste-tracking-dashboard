import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

_raw_url = os.getenv("DATABASE_URL", "").strip()

# Strip any surrounding quotes if user entered "postgresql://..."
if (_raw_url.startswith('"') and _raw_url.endswith('"')) or (_raw_url.startswith("'") and _raw_url.endswith("'")):
    _raw_url = _raw_url[1:-1].strip()

if not _raw_url:
    _DEFAULT_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "waste_management.db"))
    DATABASE_URL = f"sqlite:///{_DEFAULT_DB_PATH}"
else:
    if _raw_url.startswith("postgres://"):
        _raw_url = _raw_url.replace("postgres://", "postgresql://", 1)
    DATABASE_URL = _raw_url

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
