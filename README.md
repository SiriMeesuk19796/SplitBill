# SplitBill

A web application for managing group expenses, splitting bills, and tracking balances between group members.

## Tech Stack

**Frontend**
- Next.js
- TypeScript
- Tailwind CSS

**Backend**
- Python 3.12+
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL 16
- Pytest
- Ruff

## Project Structure

```text
SplitBill/
├── backend/
│   ├── app/
│   ├── migrations/
│   ├── tests/
│   ├── .env.example
│   ├── main.py
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── README.md
└── AI_NOTES.md
```

## Features

- Select a user and view their available groups.
- Create expenses with equal or exact splitting.
- Preview expense allocations before submission.
- Track group expenses and member balances.
- Delete expenses according to payer permissions.
- Prevent duplicate expense creation using idempotency keys.
- Support responsive layouts for desktop and mobile.

## Prerequisites

- Python 3.12+
- Node.js and npm
- PostgreSQL 16

## Backend Setup

Open a terminal in the `backend` directory.

### 1. Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and update the database connection string.

```powershell
Copy-Item .env.example .env
```

Example:

```env
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/splitbill
```

Create the PostgreSQL database named `splitbill` before continuing.

### 4. Run database migrations

```powershell
alembic upgrade head
```

### 5. Seed initial data

```powershell
python -m app.seed
```

### 6. Start the backend server

```powershell
uvicorn main:app --reload
```

Backend API: `http://127.0.0.1:8000`

API documentation: `http://127.0.0.1:8000/docs`

## Frontend Setup

Open another terminal in the `frontend` directory.

### 1. Install dependencies

```powershell
npm install
```

### 2. Start the development server

```powershell
npm run dev
```

Frontend: `http://localhost:3000`

## Running Tests and Code Quality Checks

Run backend tests from the `backend` directory:

```powershell
python -m pytest -v
```

Run Ruff:

```powershell
python -m ruff check .
```

Run frontend lint from the `frontend` directory:

```powershell
npm run lint
```

## Key Design Decisions

### Money Precision

- Monetary values use Python `Decimal` and PostgreSQL `NUMERIC(12,2)`.
- Amounts with more than two decimal places are rejected.
- API responses represent monetary values as decimal strings to avoid floating-point precision issues.

### Equal Split Allocation

When an amount cannot be divided equally, the remaining satang is distributed one at a time in the members' listed order.

For example, splitting 100.00 among three members results in:

- Member 1: 33.34
- Member 2: 33.33
- Member 3: 33.33

### Exact Split Validation

The sum of all member allocations must exactly match the expense amount. Otherwise, the request is rejected.

### Group Access Control

Only members of a group can access or modify that group's data. Unauthorized access returns an HTTP error without exposing group information.

### Idempotency

The backend uses idempotency keys to prevent duplicate expense creation when a request is repeated. The database enforces uniqueness to protect against concurrent duplicate requests.

### Expense Deletion

Expenses cannot be edited. Deletion is handled as a soft delete so the record is retained while excluded from balance calculations.

## Known Limitations

- Authentication is simplified using the `X-User` request header, as full authentication is outside the assignment scope.
- The application currently focuses on expense tracking and balance calculation.
- Payment settlement and repayment tracking are not implemented.

## Next Steps

- Implement full user authentication and authorization.
- Add payment settlement and repayment features.
- Improve deployment and production configuration.
- Expand integration and edge-case test coverage.

## Development Time

Approximate development time: 1.5 days.
