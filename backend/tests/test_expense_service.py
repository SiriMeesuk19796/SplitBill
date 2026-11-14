
from decimal import Decimal

import pytest
from pydantic import ValidationError
from sqlalchemy import func, select

from app.models.expense import Expense
from app.models.group_member import GroupMember
from app.models.user import User
from app.schemas.expense import CreateExpenseRequest
from app.services.expense_service import (
    calculate_equal_split,
    calculate_exact_split,
    create_expense,
    delete_expense,
)


def test_equal_split_remainder():
    result = calculate_equal_split(
        Decimal("100.00"),
        ["alice", "bob", "carol"],
    )

    assert result == {
        "alice": Decimal("33.34"),
        "bob": Decimal("33.33"),
        "carol": Decimal("33.33"),
    }


def test_equal_split_total_must_be_zero_sum():
    result = calculate_equal_split(
        Decimal("100.00"),
        ["alice", "bob", "carol"],
    )

    assert sum(result.values()) == Decimal("100.00")


def test_exact_split_must_equal_total():
    with pytest.raises(ValueError):
        calculate_exact_split(
            Decimal("100.00"),
            {
                "alice": Decimal("50.00"),
                "bob": Decimal("30.00"),
            },
        )


def test_expense_amount_rejects_more_than_two_decimal_places():
    with pytest.raises(ValidationError):
        CreateExpenseRequest(
            description="Coffee",
            amount="10.005",
            payer="alice",
            split_type="equal",
            split_members=["alice", "bob"],
        )


def test_repeated_idempotency_key_returns_existing_expense(db_session):
    alice = db_session.scalar(
        select(User).where(User.username == "alice")
    )

    assert alice is not None

    membership = db_session.scalar(
        select(GroupMember).where(
            GroupMember.group_id == 1,
            GroupMember.user_id == alice.id,
        )
    )

    assert membership is not None

    first_expense = create_expense(
        db=db_session,
        group_id=1,
        description="Idempotency Test",
        amount=Decimal("100.00"),
        payer="alice",
        split_type="equal",
        split_members=["alice", "bob"],
        exact_splits={},
        idempotency_key="pytest-idempotency-001",
    )

    second_expense = create_expense(
        db=db_session,
        group_id=1,
        description="Different Description",
        amount=Decimal("200.00"),
        payer="alice",
        split_type="equal",
        split_members=["alice", "bob"],
        exact_splits={},
        idempotency_key="pytest-idempotency-001",
    )

    assert first_expense.id == second_expense.id
    assert second_expense.description == "Idempotency Test"

    expense_count = db_session.scalar(
        select(func.count())
        .select_from(Expense)
        .where(
            Expense.group_id == 1,
            Expense.idempotency_key == "pytest-idempotency-001",
        )
    )

    assert expense_count == 1


def test_only_payer_can_delete_expense(db_session):
    # สร้าง Expense สำหรับทดสอบ
    expense = create_expense(
        db=db_session,
        group_id=1,
        description="Delete Permission Test",
        amount=Decimal("100.00"),
        payer="alice",
        split_type="equal",
        split_members=["alice", "bob"],
        exact_splits={},
        idempotency_key="pytest-delete-permission-001",
    )

    bob = db_session.scalar(
        select(User).where(User.username == "bob")
    )
    alice = db_session.scalar(
        select(User).where(User.username == "alice")
    )

    assert bob is not None
    assert alice is not None

    # Bob ไม่ใช่ Payer จึงไม่มีสิทธิ์ลบ
    with pytest.raises(PermissionError):
        delete_expense(
            db=db_session,
            group_id=1,
            expense_id=expense.id,
            requester_id=bob.id,
        )

    # Alice เป็น Payer จึงลบได้
    deleted_expense = delete_expense(
        db=db_session,
        group_id=1,
        expense_id=expense.id,
        requester_id=alice.id,
    )

    assert deleted_expense.deleted_at is not None
