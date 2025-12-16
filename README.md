# PledgeHub

A simple, accessible web app for collecting and displaying pledges. This repository contains the source, configuration, and deployment instructions.

## Features
- Create and view pledges
- Email or social sharing links (configurable)
- Simple admin interface for moderation
- Designed for accessibility and low-bandwidth use

## Tech stack
- Frontend: React / Vue / plain HTML (pick one in this repo)
- Backend: Node.js (Express) or Flask (Python) — see package or requirements file
- Data store: SQLite / PostgreSQL (configurable via environment variable)

## Quickstart

Prerequisites
- Git
- Node.js (>=14) and npm OR Python 3.8+ and pip (depending on chosen backend)

Clone and open
```bash
git clone <repo-url>
cd pledgehub
```

Node (example)
```bash
npm install
cp .env.example .env      # edit environment variables
npm run dev               # start in development
npm run build             # build for production
npm start                 # run production build
```

Python/Flask (example)
```bash
python -m venv .venv
.venv/Scripts/activate    # Windows
pip install -r requirements.txt
cp .env.example .env
flask run
```

## Configuration
Create a `.env` file from `.env.example` and set:
- DATABASE_URL — connection string for the database
- PORT — server port
- JWT_SECRET / SESSION_SECRET — secrets for authentication
- EMAIL_* — SMTP settings if using email features

## Tests
Run unit and integration tests (adjust to your test runner):
```bash
npm test
# or
pytest
```

## Development notes
- Keep API routes RESTful under `/api`
- Validate and sanitize all user input
- Implement rate limiting and basic spam protection for pledge submissions
- Use migrations for schema changes (knex, sequelize, alembic, etc.)

## Contributing
1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit and push
4. Open a pull request with a clear description and tests

## License
Specify a license in `LICENSE` (e.g., MIT). If none provided, contact the maintainer.

## Contact
For questions or help, open an issue or reach out to the repository maintainers.

