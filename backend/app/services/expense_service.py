from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.expense_split import ExpenseSplit
from app.models.group_member import GroupMember
from app.models.user import User


def calculate_equal_split(
    total_amount: Decimal,
    members: list[str],
) -> dict[str, Decimal]:
    if not members:
        raise ValueError("At least one member is required")

    if len(members) != len(set(members)):
        raise ValueError("Duplicate members are not allowed")

    total_amount = Decimal(total_amount)

    if total_amount <= 0:
        raise ValueError("Amount must be greater than zero")

    if total_amount.as_tuple().exponent < -2:
        raise ValueError("Amount cannot have more than 2 decimal places")

    total_satang = int(total_amount * 100)
    base_satang = total_satang // len(members)
    remainder = total_satang % len(members)

    result = {}

    for index, username in enumerate(members):
        share_satang = base_satang

        if index < remainder:
            share_satang += 1

        result[username] = Decimal(share_satang) / Decimal(100)

    return result


def calculate_exact_split(
    total_amount: Decimal,
    splits: dict[str, Decimal],
) -> dict[str, Decimal]:
    if not splits:
        raise ValueError("At least one split member is required")

    for username, amount in splits.items():
        if amount <= 0:
            raise ValueError(
                f"Split amount for {username} must be greater than zero"
            )

        if amount.as_tuple().exponent < -2:
            raise ValueError(
                f"Split amount for {username} cannot have more than 2 decimal places"
            )

    if sum(splits.values(), Decimal("0.00")) != total_amount:
        raise ValueError(
            "The sum of exact splits must equal the total expense amount"
        )

    return splits


def validate_group_members(
    db: Session,
    group_id: int,
    usernames: list[str],
) -> dict[str, int]:
    users = db.scalars(
        select(User)
        .join(GroupMember, User.id == GroupMember.user_id)
        .where(
            GroupMember.group_id == group_id,
            User.username.in_(usernames),
        )
    ).all()

    user_map = {
        user.username: user.id
        for user in users
    }

    missing_users = [
        username
        for username in usernames
        if username not in user_map
    ]

    if missing_users:
        raise ValueError(
            f"Users are not members of this group: {', '.join(missing_users)}"
        )

    return user_map


def create_expense(
    db: Session,
    group_id: int,
    description: str,
    amount: Decimal,
    payer: str,
    split_type: str,
    split_members: list[str],
    exact_splits: dict[str, Decimal],
    creator_id: int,
    idempotency_key: str | None = None,
) -> Expense:
    if idempotency_key:
        existing = db.scalar(
            select(Expense).where(
                Expense.group_id == group_id,
                Expense.idempotency_key == idempotency_key,
            )
        )
        if existing:
            return existing

    if split_type == "equal":
        usernames = [payer, *split_members]
        splits = calculate_equal_split(amount, split_members)

    elif split_type == "exact":
        usernames = [payer, *exact_splits.keys()]
        splits = calculate_exact_split(amount, exact_splits)

    else:
        raise ValueError("Invalid split type")

    user_map = validate_group_members(
        db,
        group_id,
        usernames,
    )

    expense = Expense(
        group_id=group_id,
        description=description,
        amount=amount,
        payer_id=user_map[payer],
        created_by_id=creator_id,
        idempotency_key=idempotency_key,
    )

    try:
        db.add(expense)
        db.flush()

        for username, split_amount in splits.items():
            db.add(
                ExpenseSplit(
                    expense_id=expense.id,
                    user_id=user_map[username],
                    amount=split_amount,
                )
            )

        db.commit()
        db.refresh(expense)

    except IntegrityError:
        db.rollback()

        if idempotency_key:
            existing = db.scalar(
                select(Expense).where(
                    Expense.group_id == group_id,
                    Expense.idempotency_key == idempotency_key,
                )
            )
            if existing:
                return existing

        raise

    except Exception:
        db.rollback()
        raise

    else:
        return expense



def delete_expense(
    db: Session,
    group_id: int,
    expense_id: int,
    requester_id: int,
) -> Expense:
    expense = db.scalar(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.group_id == group_id,
            Expense.deleted_at.is_(None),
        )
    )

    if expense is None:
        raise ValueError("Expense not found")

    if expense.payer_id != requester_id:
        raise PermissionError("Only the payer can delete this expense")

    expense.deleted_at = datetime.now(UTC)

    db.commit()
    db.refresh(expense)

    return expense
