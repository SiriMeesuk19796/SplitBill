# SplitBill

A web application for managing group expenses, splitting bills, and tracking balances between group members.

## Tech Stack

**Frontend**
- Next.js
- React
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
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── seed.py
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
│   ├── package.json
│   └── package-lock.json
├── README.md
└── AI_NOTES.md
```

## Prerequisites

Install the following software before setting up the project:

| Software | Requirement |
|---|---|
| Python | 3.12 or newer |
| Node.js | LTS version |
| npm | Included with Node.js |
| PostgreSQL | 16 |
| Git | Required to clone the repository |

Verify the installations:

```powershell
python --version
node --version
npm --version
git --version
```

## 1. Clone the Repository

Open PowerShell and run:

```powershell
git clone https://github.com/SiriMeesuk19796/SplitBill.git
cd SplitBill
```

## 2. Set Up PostgreSQL

Make sure the PostgreSQL service is running.

Create a database named `splitbill` before configuring the backend.

### Option A: Using pgAdmin

1. Open pgAdmin.
2. Connect to your PostgreSQL server.
3. Expand the Servers section.
4. Right-click Databases.
5. Select Create → Database.
6. Enter `splitbill` as the database name.
7. Save.

### Option B: Using PostgreSQL SQL Shell (psql)

Connect to PostgreSQL using your PostgreSQL username, then execute:

```sql
CREATE DATABASE splitbill;
```

Verify that the database exists:

```sql
SELECT datname FROM pg_database WHERE datname = 'splitbill';
```

## 3. Set Up the Backend

Open a new PowerShell terminal in the project root directory.

Navigate to the backend:

```powershell
cd backend
```

### 3.1 Create a Virtual Environment

```powershell
python -m venv .venv
```

Activate the virtual environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks script execution, run the following command once:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then activate the environment again.

### 3.2 Install Dependencies

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3.3 Configure Environment Variables

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Open `.env` and update the database connection string:

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/splitbill
```

Replace:
- `postgres` with your PostgreSQL username if different.
- `YOUR_PASSWORD` with your actual PostgreSQL password.
- `localhost:5432` if your PostgreSQL server uses a different host or port.

Do not commit `.env` to Git. The file is excluded through `.gitignore`.

### 3.4 Run Database Migrations

Make sure you are still in the `backend` directory and your virtual environment is activated.

Run:

```powershell
alembic upgrade head
```

This creates the required database tables using the project's Alembic migrations.

### 3.5 Seed Initial Data

Run:

```powershell
python -m app.seed
```

The seed script creates the initial users, groups, and group memberships if they do not already exist.

Initial users:

| Username | Display Name |
|---|---|
| alice | Alice |
| bob | Bob |
| carol | Carol |
| dan | Dan |

Initial groups:

| Group | Members |
|---|---|
| Chiang Mai trip | alice, bob, carol |
| Office lunch | bob, dan |

### 3.6 Start the Backend Server

```powershell
uvicorn main:app --reload
```

The backend should now be available at:

- API: http://127.0.0.1:8000
- API Documentation: http://127.0.0.1:8000/docs
- Health Check: http://127.0.0.1:8000/health

Verify the backend by opening:

http://127.0.0.1:8000/health

Expected response:

```json
{
  "status": "healthy",
  "application": "SplitBill API"
}
```

Keep this terminal running while using the frontend.

## 4. Set Up the Frontend

Open a second PowerShell terminal in the project root directory.

Navigate to the frontend:

```powershell
cd frontend
```

### 4.1 Install Dependencies

```powershell
npm install
```

### 4.2 Start the Frontend Server

```powershell
npm run dev
```

The frontend should now be available at:

http://localhost:3000

Make sure the backend server is running at the same time.

## 5. Running Tests and Code Quality Checks

### Backend Tests

Open a PowerShell terminal in the `backend` directory and activate the virtual environment.

Run:

```powershell
python -m pytest -v
```

### Python Code Quality Check

From the `backend` directory:

```powershell
python -m ruff check .
```

### Frontend Lint

Open a PowerShell terminal in the `frontend` directory:

```powershell
npm run lint
```

### Frontend Production Build

From the `frontend` directory:

```powershell
npm run build
```

## Features

- Select a user and view their available groups.
- Create expenses using equal or exact splitting.
- Preview expense allocations before submission.
- Track group expenses and member balances.
- Delete expenses according to payer permissions.
- Prevent duplicate expense creation using idempotency keys.
- Support responsive layouts for desktop and mobile.

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

Only members of a group can access or modify that group's data.

- HTTP 404 is returned when a group does not exist or the requesting user is not a member.
- HTTP 403 is returned when a non-payer attempts to delete an expense.

Returning 404 for non-members prevents exposing whether a group exists.

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
