from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.enums import OrderStatus, PlanInterval


class PlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    interval: PlanInterval
    duration_days: int | None
    price: Decimal
    currency: str


class CheckoutIn(BaseModel):
    plan_id: int
    gateway: str


class CheckoutOut(BaseModel):
    order_id: int
    gateway: str
    amount: Decimal
    currency: str
    # Where the user is sent to complete payment (sandbox/mock in dev).
    checkout_url: str
    # Optional QR payload for bank-transfer gateways (e.g. PayOS).
    qr_data: str | None = None


class ConfirmIn(BaseModel):
    order_id: int


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: OrderStatus
    amount: Decimal
    currency: str
    gateway: str


class SubscriptionOut(BaseModel):
    is_vip: bool
    vip_until: datetime | None
