from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ExactSplitInput(BaseModel):
    username: str
    amount: Decimal

    @field_validator("amount", mode="before")
    @classmethod
    def validate_amount_format(cls, value):
        if not isinstance(value, str):
            raise ValueError("Amount must be a string")

        amount = Decimal(value)

        if amount <= 0:
            raise ValueError("Split amount must be greater than zero")

        if amount.as_tuple().exponent < -2:
            raise ValueError("Split amount cannot have more than 2 decimal places")

        return amount


class CreateExpenseRequest(BaseModel):
    description: str = Field(min_length=1, max_length=255)
    amount: Decimal
    payer: str
    split_type: Literal["equal", "exact"]
    split_members: list[str] = Field(default_factory=list)
    exact_splits: list[ExactSplitInput] = Field(default_factory=list)

    @field_validator("amount", mode="before")
    @classmethod
    def validate_amount_format(cls, value):
        if not isinstance(value, str):
            raise ValueError("Amount must be a string")

        amount = Decimal(value)

        if amount <= 0:
            raise ValueError("Amount must be greater than zero")

        if amount.as_tuple().exponent < -2:
            raise ValueError("Amount cannot have more than 2 decimal places")

        return amount

    @model_validator(mode="after")
    def validate_split_data(self):
        if self.split_type == "equal":
            if not self.split_members:
                raise ValueError("At least one split member is required")

            if self.exact_splits:
                raise ValueError("Exact splits must not be provided for equal split")

            if len(self.split_members) != len(set(self.split_members)):
                raise ValueError("Duplicate split members are not allowed")

        if self.split_type == "exact":
            if not self.exact_splits:
                raise ValueError("Exact split amounts are required")

            if self.split_members:
                raise ValueError("Split members must not be provided for exact split")

            usernames = [item.username for item in self.exact_splits]

            if len(usernames) != len(set(usernames)):
                raise ValueError("Duplicate exact split members are not allowed")

        return self


class ExpenseSplitResponse(BaseModel):
    username: str
    amount: Decimal


class ExpenseResponse(BaseModel):
    id: int
    description: str
    amount: Decimal
    payer: str
    splits: list[ExpenseSplitResponse]

    model_config = ConfigDict(from_attributes=True)
