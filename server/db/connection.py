from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

from .base import Base
from .config import Config


def create_db_engine():
    engine = create_engine(
        url=Config.DATABASE_URL,
        poolclass=QueuePool,
        pool_size=Config.POOL_SIZE,
        max_overflow=Config.MAX_OVERFLOW,
        pool_timeout=Config.POOL_TIMEOUT,
        pool_recycle=Config.POOL_RECYCLE,
        echo=False,
    )
    return engine


def create_session_factory():
    engine = create_db_engine()
    SessionLocal = sessionmaker(autoflush=True, autocommit=False, bind=engine)
    return SessionLocal


def get_db_conn() -> Generator:
    SessionLocal = create_session_factory()
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    engine = create_db_engine()
    Base.metadata.create_all(engine)
