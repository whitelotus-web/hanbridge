"""Pluggable payment gateways.

Each gateway turns a pending :class:`Order` into checkout instructions. Real
provider integrations (PayPal REST, PayOS) plug in here; until credentials are
configured the gateways run in *mock* mode, returning a local checkout URL that
the confirm endpoint can settle. Add a new provider by implementing
:class:`PaymentGateway` and registering it in ``GATEWAYS``.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from app.core.config import settings
from app.models.billing import Order


@dataclass
class CheckoutInstructions:
    checkout_url: str
    qr_data: str | None = None


class PaymentGateway(Protocol):
    name: str

    def create_checkout(self, order: Order) -> CheckoutInstructions: ...


def _mock_checkout_url(order: Order) -> str:
    return f"{settings.FRONTEND_URL}/checkout/mock?order={order.id}"


class PayPalGateway:
    """International card / PayPal balance payments."""

    name = "paypal"

    def create_checkout(self, order: Order) -> CheckoutInstructions:
        # TODO: replace with PayPal Orders v2 create-order when creds are set.
        return CheckoutInstructions(checkout_url=_mock_checkout_url(order))


class PayOSGateway:
    """Vietnam bank-transfer via PayOS (VietQR), works for every local bank."""

    name = "payos"

    def create_checkout(self, order: Order) -> CheckoutInstructions:
        # TODO: replace with PayOS create-payment-link + real VietQR string.
        qr = f"HANBRIDGE|ORDER:{order.id}|{order.amount}{order.currency}"
        return CheckoutInstructions(
            checkout_url=_mock_checkout_url(order), qr_data=qr
        )


GATEWAYS: dict[str, PaymentGateway] = {
    g.name: g for g in (PayPalGateway(), PayOSGateway())
}


def get_gateway(name: str) -> PaymentGateway | None:
    return GATEWAYS.get(name)
