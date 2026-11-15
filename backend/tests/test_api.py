import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.core.database import get_db
from app.models.expense import Expense
from main import app


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_alice_cannot_access_group_2(client):
    response = client.get(
        "/groups/2",
        headers={"X-User": "alice"},
    )

    assert response.status_code == 404


def test_alice_cannot_create_expense_in_group_2(client):
    response = client.post(
        "/groups/2/expenses",
        headers={"X-User": "alice"},
        json={
            "description": "Unauthorized expense",
            "amount": "100.00",
            "payer": "alice",
            "split_type": "equal",
            "split_members": ["alice"],
        },
    )

    assert response.status_code == 404


def test_unknown_user_cannot_access_groups(client):
    response = client.get(
        "/groups",
        headers={"X-User": "unknown"},
    )

    assert response.status_code == 401


def test_repeated_idempotency_key_returns_same_expense(client,db_session,):
    headers = {
        "X-User": "alice",
        "Idempotency-Key": "api-test-key-001",
    }

    payload = {
        "description": "API Idempotency Test",
        "amount": "100.00",
        "payer": "alice",
        "split_type": "equal",
        "split_members": ["alice", "bob", "carol"],
    }

    first_response = client.post(
        "/groups/1/expenses",
        headers=headers,
        json=payload,
    )

    second_response = client.post(
        "/groups/1/expenses",
        headers=headers,
        json=payload,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    first_expense = first_response.json()
    second_expense = second_response.json()

    assert first_expense["id"] == second_expense["id"]
    expense_count = db_session.scalar(
        select(func.count())
        .select_from(Expense)
        .where(
            Expense.group_id == 1,
            Expense.idempotency_key == "api-test-key-001",
        )
    )

    assert expense_count == 1


def test_non_payer_cannot_delete_expense(client):
    # Alice สร้างบิลและเป็นผู้จ่าย
    create_response = client.post(
        "/groups/1/expenses",
        headers={"X-User": "alice"},
        json={
            "description": "Delete Permission Test",
            "amount": "100.00",
            "payer": "alice",
            "split_type": "equal",
            "split_members": ["alice", "bob"],
        },
    )

    assert create_response.status_code == 201
    expense_id = create_response.json()["id"]

    # Bob พยายามลบบิลที่ Alice เป็นผู้จ่าย
    response = client.delete(
        f"/groups/1/expenses/{expense_id}",
        headers={"X-User": "bob"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Only the payer can delete this expense"