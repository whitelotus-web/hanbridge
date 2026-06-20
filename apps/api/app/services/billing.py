from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.billing import Order, Plan
from app.models.enums import OrderStatus
from app.models.user import User
from app.services.gateways import CheckoutInstructions, get_gateway

# Far-future sentinel used for lifetime plans (no expiry).
LIFETIME_UNTIL = datetime(2099, 12, 31, tzinfo=UTC)


def list_plans(db: Session) -> list[Plan]:
    return list(
        db.scalars(
            select(Plan).where(Plan.is_active.is_(True)).order_by(Plan.id)
        ).all()
    )


def is_vip(user: User) -> bool:
    if user.vip_until is None:
        return False
    until = user.vip_until
    if until.tzinfo is None:
        until = until.replace(tzinfo=UTC)
    return until > datetime.now(UTC)


def create_checkout(
    db: Session, user: User, plan: Plan, gateway_name: str
) -> tuple[Order, CheckoutInstructions]:
    gateway = get_gateway(gateway_name)
    if gateway is None:
        raise ValueError(f"Unsupported gateway: {gateway_name}")

    order = Order(
        user_id=user.id,
        plan_id=plan.id,
        status=OrderStatus.pending,
        amount=plan.price,
        currency=plan.currency,
        gateway=gateway_name,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    instructions = gateway.create_checkout(order)
    return order, instructions


def _extend_vip(user: User, plan: Plan) -> None:
    if plan.duration_days is None:
        user.vip_until = LIFETIME_UNTIL
        return
    now = datetime.now(UTC)
    base = user.vip_until
    if base is not None and base.tzinfo is None:
        base = base.replace(tzinfo=UTC)
    start = base if base is not None and base > now else now
    user.vip_until = start + timedelta(days=plan.duration_days)


def confirm_order(db: Session, user: User, order_id: int) -> Order:
    order = db.scalar(
        select(Order).where(Order.id == order_id, Order.user_id == user.id)
    )
    if order is None:
        raise LookupError("Order not found")
    if order.status == OrderStatus.paid:
        return order

    plan = db.get(Plan, order.plan_id)
    if plan is None:
        raise LookupError("Plan not found")

    order.status = OrderStatus.paid
    _extend_vip(user, plan)
    db.commit()
    db.refresh(order)
    return order
