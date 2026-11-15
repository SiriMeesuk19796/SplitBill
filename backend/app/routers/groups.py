from decimal import Decimal

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.expense import Expense
from app.models.expense_split import ExpenseSplit
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.user import User
from app.schemas.balance import BalanceResponse
from app.schemas.expense import CreateExpenseRequest, ExpenseResponse
from app.schemas.group import GroupResponse
from app.services.expense_service import create_expense, delete_expense

router = APIRouter(
    prefix="/groups",
    tags=["Groups"],
)


@router.get("", response_model=list[GroupResponse])
def get_groups(
    x_user: str = Header(..., alias="X-User"),
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(User.username == x_user)
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Unknown user",
        )

    groups = db.scalars(
        select(Group)
        .join(GroupMember, Group.id == GroupMember.group_id)
        .where(GroupMember.user_id == user.id)
    ).all()

    return groups

@router.get("/{group_id}", response_model=GroupResponse)
def get_group(
    group_id: int,
    x_user: str = Header(..., alias="X-User"),
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User).where(User.username == x_user)
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Unknown user",
        )

    group = db.scalar(
        select(Group)
        .join(GroupMember, Group.id == GroupMember.group_id)
        .where(
            Group.id == group_id,
            GroupMember.user_id == user.id,
        )
    )

    if group is None:
        raise HTTPException(
            status_code=404,
            detail="Group not found",
        )

    return group

@router.post(
    "/{group_id}/expenses",
    response_model=ExpenseResponse,
    status_code=201,
)
def add_expense(
    group_id: int,
    request: CreateExpenseRequest,
    x_user: str = Header(..., alias="X-User"),
    idempotency_key: str | None = Header(
        default=None,
        alias="Idempotency-Key",
    ),
    db: Session = Depends(get_db),
):
    # 1. ตรวจสอบผู้เรียก API
    user = db.scalar(
        select(User).where(User.username == x_user)
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Unknown user",
        )

    # 2. ตรวจสอบว่าผู้เรียกเป็นสมาชิกของกลุ่ม
    membership = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user.id,
        )
    )

    if membership is None:
        raise HTTPException(
            status_code=404,
            detail="Group not found",
        )

    # 3. แปลง Exact Split จาก Schema เป็น Dictionary
    exact_splits = {
        item.username: item.amount
        for item in request.exact_splits
    }

    # 4. เรียก Service เพื่อสร้าง Expense
    try:
        expense = create_expense(
            db=db,
            group_id=group_id,
            description=request.description,
            amount=request.amount,
            payer=request.payer,
            split_type=request.split_type,
            split_members=request.split_members,
            exact_splits=exact_splits,
            creator_id=user.id,
            idempotency_key=idempotency_key,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    # 5. ดึงชื่อผู้จ่าย
    payer_name = db.scalar(
        select(User.username).where(
            User.id == expense.payer_id
        )
    )

    # 5.1 ดึงชื่อผู้สร้างบิล
    creator_name = db.scalar(
        select(User.username).where(
            User.id == expense.created_by_id
        )
    )

    # 6. ดึงข้อมูลยอดแบ่งของสมาชิก
    split_rows = db.execute(
        select(User.username, ExpenseSplit.amount)
        .join(
            ExpenseSplit,
            User.id == ExpenseSplit.user_id,
        )
        .where(ExpenseSplit.expense_id == expense.id)
    ).all()

    # 7. ส่ง Response กลับ
    return {
        "id": expense.id,
        "description": expense.description,
        "amount": expense.amount,
        "payer": payer_name,
        "created_by": creator_name,
        "splits": [
            {
                "username": row.username,
                "amount": row.amount,
            }
            for row in split_rows
        ],
    }


@router.get(
    "/{group_id}/expenses",
    response_model=list[ExpenseResponse],
)
def get_expenses(
    group_id: int,
    x_user: str = Header(..., alias="X-User"),
    db: Session = Depends(get_db),
):
    # 1. ตรวจสอบผู้เรียก API
    user = db.scalar(
        select(User).where(User.username == x_user)
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Unknown user",
        )

    # 2. ตรวจสอบสิทธิ์สมาชิกในกลุ่ม
    membership = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user.id,
        )
    )

    if membership is None:
        raise HTTPException(
            status_code=404,
            detail="Group not found",
        )

    # 3. ดึง Expense ที่ยังไม่ถูกลบ
    expenses = db.scalars(
        select(Expense)
        .where(
            Expense.group_id == group_id,
            Expense.deleted_at.is_(None),
        )
        .order_by(Expense.created_at.desc())
    ).all()

    # 4. สร้าง Response พร้อมข้อมูล Payer และ Splits
    result = []

    for expense in expenses:
        payer_name = db.scalar(
            select(User.username).where(
                User.id == expense.payer_id
            )
        )

        # ดึงชื่อผู้สร้างบิล
        creator_name = db.scalar(
            select(User.username).where(
                User.id == expense.created_by_id
            )
        )

        split_rows = db.execute(
            select(User.username, ExpenseSplit.amount)
            .join(
                ExpenseSplit,
                User.id == ExpenseSplit.user_id,
            )
            .where(ExpenseSplit.expense_id == expense.id)
        ).all()

        result.append({
            "id": expense.id,
            "description": expense.description,
            "amount": expense.amount,
            "payer": payer_name,
            "created_by": creator_name,
            "splits": [
                {
                    "username": row.username,
                    "amount": row.amount,
                }
                for row in split_rows
            ],
        })

    return result


@router.get(
    "/{group_id}/balances",
    response_model=list[BalanceResponse],
)
def get_balances(
    group_id: int,
    x_user: str = Header(..., alias="X-User"),
    db: Session = Depends(get_db),
):
    # 1. ตรวจสอบผู้เรียก API
    user = db.scalar(
        select(User).where(User.username == x_user)
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Unknown user",
        )

    # 2. ตรวจสอบสิทธิ์สมาชิกในกลุ่ม
    membership = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user.id,
        )
    )

    if membership is None:
        raise HTTPException(
            status_code=404,
            detail="Group not found",
        )

    # 3. ดึงสมาชิกทั้งหมดในกลุ่ม
    members = db.execute(
        select(User.id, User.username)
        .join(GroupMember, User.id == GroupMember.user_id)
        .where(GroupMember.group_id == group_id)
    ).all()

    # 4. คำนวณยอดจ่ายและยอดส่วนแบ่งของแต่ละคน
    results = []

    for member in members:
        total_paid = db.scalar(
            select(func.coalesce(func.sum(Expense.amount), 0))
            .where(
                Expense.group_id == group_id,
                Expense.payer_id == member.id,
                Expense.deleted_at.is_(None),
            )
        )

        total_share = db.scalar(
            select(func.coalesce(func.sum(ExpenseSplit.amount), 0))
            .join(
                Expense,
                Expense.id == ExpenseSplit.expense_id,
            )
            .where(
                Expense.group_id == group_id,
                ExpenseSplit.user_id == member.id,
                Expense.deleted_at.is_(None),
            )
        )

        total_paid = Decimal(str(total_paid))
        total_share = Decimal(str(total_share))

        results.append({
            "username": member.username,
            "total_paid": total_paid,
            "total_share": total_share,
            "balance": total_paid - total_share,
        })

    return results

@router.delete(
    "/{group_id}/expenses/{expense_id}",
)
def remove_expense(
    group_id: int,
    expense_id: int,
    x_user: str = Header(..., alias="X-User"),
    db: Session = Depends(get_db),
):
    # 1. ตรวจสอบผู้เรียก API
    user = db.scalar(
        select(User).where(User.username == x_user)
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Unknown user",
        )

    # 2. ตรวจสอบสิทธิ์สมาชิกในกลุ่ม
    membership = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user.id,
        )
    )

    if membership is None:
        raise HTTPException(
            status_code=404,
            detail="Group not found",
        )

    # 3. เรียก Service เพื่อลบ Expense แบบ Soft Delete
    try:
        expense = delete_expense(
            db=db,
            group_id=group_id,
            expense_id=expense_id,
            requester_id=user.id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error

    except PermissionError as error:
        raise HTTPException(
            status_code=403,
            detail=str(error),
        ) from error

    return {
        "message": "Expense deleted successfully",
        "expense_id": expense.id,
    }