from decimal import Decimal

from pydantic import BaseModel


class BalanceResponse(BaseModel):
    username: str
    total_paid: Decimal
    total_share: Decimal
    balance: Decimal