# AI Usage Notes

## AI Tools Used

ChatGPT was used as an AI assistant during development.

## How AI Was Used

AI assistance was used for:

- Understanding the assignment requirements and breaking them into implementation tasks.
- Reviewing backend business logic, API behavior, and database design.
- Discussing expense splitting calculations and monetary precision using Decimal.
- Reviewing frontend functionality, responsive layouts, and TypeScript/React code.
- Suggesting test cases and debugging errors.
- Preparing project documentation.

All generated suggestions and code were reviewed before being applied.

## Effective Prompts

Examples of prompts used during development:

1. "Review my expense splitting logic against the assignment requirements. Check equal splitting, exact allocation, monetary precision, and balance calculations. Explain any issues and suggest corrections."

2. "Review this FastAPI or Next.js code for potential bugs and explain how to fix them step by step. Keep the solution appropriate for a junior developer."

## Incorrect AI Suggestion and Correction

During development, an incorrect command context was suggested for running the frontend lint check:

```powershell
npm run lint
```

The command was initially run inside the backend directory and failed because that directory does not contain a `package.json` file.

I checked the project structure and identified that the frontend has its own `package.json`. I then ran the command from the frontend directory, where it completed successfully.

This reinforced the importance of checking the project structure and verifying AI-generated commands before using them.

## Review and Verification Process

Before committing changes, I reviewed the implementation against the assignment requirements and performed relevant checks:

- Reviewed business logic and API behavior.
- Ran backend tests using Pytest.
- Checked Python code quality using Ruff.
- Ran frontend lint checks using ESLint.
- Tested the frontend on desktop and mobile screen sizes.
- Reviewed Git changes before committing and pushing.

AI suggestions were treated as assistance rather than authoritative answers. Final implementation decisions were based on the assignment requirements and verification through code review and tests.

## Developer Responsibility

I am responsible for understanding, reviewing, testing, and maintaining the submitted code. AI-generated code was not accepted without review.
