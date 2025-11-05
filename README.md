# Ruffles - Raffle Administration System

A web application for managing raffles and ticket sales for non-profit associations.

## Tech Stack

- **Backend**: Django 5.2.7, Django REST Framework 3.16.1, Celery 5.5.3
- **Frontend**: React 19.2, Vite, Axios
- **Database**: PostgreSQL 17
- **Cache/Message Broker**: Redis 7.4
- **Python**: 3.13
- **Node.js**: 24 LTS

## Prerequisites

- Python 3.13+
- Node.js 24+ (LTS)
- Docker & Docker Compose
- PostgreSQL 17 (optional, if running locally without Docker)
- Redis 7.4 (optional, if running locally without Docker)

## Quick Start

### Using Docker Compose

```
# Clone and navigate to project
git clone <repository-url>
cd ruffles

# Start all services
docker-compose up -d

# Backend: http://localhost:8000
# Frontend: http://localhost:5173
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### Local Development

**Backend:**
```
cd backend
python3.13 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

**Frontend:**
```
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Project Structure

```
ruffles/
├── backend/              # Django REST API
│   ├── apps/            # Django apps (authentication, raffles, purchases, payments)
│   ├── config/          # Django configuration & settings
│   └── manage.py
├── frontend/            # React SPA
│   ├── src/
│   ├── public/
│   └── package.json
└── docker-compose.yml
```

## Environment Setup

Copy `.env.example` to `.env` in both `backend/` and `frontend/` directories and update values as needed.

## API Documentation

Once backend is running:
- Swagger/OpenAPI docs: `http://localhost:8000/api/schema/swagger/`
- ReDoc: `http://localhost:8000/api/schema/redoc/`

## License

MIT
