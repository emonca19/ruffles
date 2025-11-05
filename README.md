# Ruffles - Raffle Administration System

A web application for managing raffles and ticket sales for non-profit associations.

## Tech Stack

- **Backend**: Django 5.2.7, Django REST Framework 3.16.1, Celery 5.5.3
- **Frontend**: React 19.2, Vite, Axios
- **Database**: PostgreSQL 17 (Docker)
- **Cache/Message Broker**: Redis 7.4 (Docker)
- **Python**: 3.13
- **Node.js**: 24 LTS

## Prerequisites

- Python 3.13+
- Node.js 24+ (LTS)
- pnpm 9+
- Docker & Docker Compose

## Quick Start

### 1. Start Backend & Database (Docker)

```
docker-compose up -d

# Backend: http://localhost:8000
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### 2. Run Frontend Locally

In a new terminal:

```
cd frontend
cp .env.example .env
pnpm install
pnpm run dev

# Frontend: http://localhost:5173
```

## Local Development (No Docker)

### Backend

```
cd backend
python3.13 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

### Frontend

```
cd frontend
cp .env.example .env
pnpm install
pnpm run dev
```

**Note**: For local backend development, you'll need PostgreSQL 17 and Redis 7.4 running separately.

## Project Structure

```
ruffles/
├── backend/              # Django REST API (Dockerized)
│   ├── apps/            # Django apps
│   ├── config/          # Settings & URL routing
│   └── manage.py
├── frontend/            # React SPA (Local development)
│   ├── src/
│   ├── public/
│   └── package.json
└── docker-compose.yml   # Backend + DB only
```

## Environment Setup

Copy `.env.example` to `.env`:

```
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update values as needed for your environment.

## API Documentation

Once backend is running:
- Swagger/OpenAPI: `http://localhost:8000/api/schema/swagger/`
- ReDoc: `http://localhost:8000/api/schema/redoc/`

## License

MIT