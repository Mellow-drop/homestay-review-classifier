import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine
from api.models import Base

load_dotenv()
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if "pgbouncer=" in DATABASE_URL:
    if "?" in DATABASE_URL:
        base_url, query_str = DATABASE_URL.split("?", 1)
        params = [p for p in query_str.split("&") if not p.startswith("pgbouncer=")]
        DATABASE_URL = f"{base_url}?{'&'.join(params)}" if params else base_url

engine = create_engine(DATABASE_URL)
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("Tables dropped and recreated successfully.")
