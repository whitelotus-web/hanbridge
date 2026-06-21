from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
import app.models  # Load all models for metadata registration
from app.main import app

engine = create_engine(settings.DATABASE_URL, future=True)

# Create all tables for the test session
Base.metadata.create_all(bind=engine)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Wrap each test in a transaction that is rolled back afterwards."""
    # For SQLite, recreate all tables before each test to ensure a clean slate and avoid cross-test pollution.
    if "sqlite" in settings.DATABASE_URL:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    connection = engine.connect()
    transaction = connection.begin()
    # create_savepoint lets service-layer commit() calls commit to a SAVEPOINT,
    # so the outer rollback still discards everything after the test.
    session = sessionmaker(
        bind=connection,
        autoflush=False,
        autocommit=False,
        join_transaction_mode="create_savepoint",
    )()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def _override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_db, None)
