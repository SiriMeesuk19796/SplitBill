
import pytest

from app.core.database import SessionLocal, engine
from app.models.expense import Expense  # noqa: F401
from app.models.expense_split import ExpenseSplit  # noqa: F401
from app.models.group import Group  # noqa: F401
from app.models.group_member import GroupMember  # noqa: F401
from app.models.user import User  # noqa: F401


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()

    db = SessionLocal(
        bind=connection,
        join_transaction_mode="create_savepoint",
    )

    try:
        yield db
    finally:
        db.close()
        transaction.rollback()
        connection.close()
