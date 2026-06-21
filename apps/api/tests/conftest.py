from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.db.session import get_db
from app.main import app

engine = create_engine(settings.DATABASE_URL, future=True)


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Wrap each test in a transaction that is rolled back afterwards."""
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
