from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.billing import Plan
from app.models.user import User
from app.schemas.billing import (
    CheckoutIn,
    CheckoutOut,
    ConfirmIn,
    OrderOut,
    PlanOut,
    SubscriptionOut,
)
from app.services import billing as billing_service
from app.services.gateways import GATEWAYS

router = APIRouter(tags=["billing"])


@router.get("/plans", response_model=list[PlanOut])
def list_plans(db: Session = Depends(get_db)) -> list[Plan]:
    return billing_service.list_plans(db)


@router.get("/billing/gateways", response_model=list[str])
def list_gateways() -> list[str]:
    return list(GATEWAYS.keys())


@router.post("/billing/checkout", response_model=CheckoutOut)
def checkout(
    payload: CheckoutIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CheckoutOut:
    plan = db.get(Plan, payload.plan_id)
    if plan is None or not plan.is_active:
        raise HTTPException(status_code=404, detail="Plan not found")
    try:
        order, instructions = billing_service.create_checkout(
            db, user, plan, payload.gateway
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return CheckoutOut(
        order_id=order.id,
        gateway=order.gateway,
        amount=order.amount,
        currency=order.currency,
        checkout_url=instructions.checkout_url,
        qr_data=instructions.qr_data,
    )


@router.post("/billing/confirm", response_model=OrderOut)
def confirm(
    payload: ConfirmIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OrderOut:
    try:
        order = billing_service.confirm_order(db, user, payload.order_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return OrderOut.model_validate(order)


@router.get("/me/subscription", response_model=SubscriptionOut)
def my_subscription(
    user: User = Depends(get_current_user),
) -> SubscriptionOut:
    return SubscriptionOut(
        is_vip=billing_service.is_vip(user), vip_until=user.vip_until
    )
