from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    dashboard,
    health,
    levels,
    mock,
    practice,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(levels.router)
api_router.include_router(practice.router)
api_router.include_router(mock.router)
api_router.include_router(dashboard.router)
