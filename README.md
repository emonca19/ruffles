# Ruffles - Raffle Administration System

A web application for managing raffles and ticket sales for non-profit associations.

## Tech Stack

- **Backend**: Django 5.2.7, Django REST Framework 3.16.1
- **Frontend**: React 19.2, Vite, Axios
- **Database**: PostgreSQL 17 (Docker)
- **Cache**: Redis 7.4 (Docker)
- **Python**: 3.13
- **Node.js**: 24 LTS

## Prerequisites

- Python 3.13+
- Node.js 24+ (LTS)
- pnpm 9+
- Docker & Docker Compose

## Quick Start

### 1. Setup Environment Files

```
cd ruffles

# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update values as needed (defaults work for local development)
```

### 2. Start Backend & Database (Docker)

```
docker compose up -d

# Backend: http://localhost:8000
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### 3. Run Migrations

```
docker compose exec django python manage.py migrate
```

### 4. Create Superuser (Optional)

```
docker compose exec django python manage.py createsuperuser
# Follow prompts to create admin account
```

### 5. Run Frontend Locally

In a new terminal:

```
cd frontend
pnpm install
pnpm run dev

# Frontend: http://localhost:5173
```

## Local Development (Without Docker)

### 1. Setup Environment

```
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Backend

```
cd backend
python3.13 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start PostgreSQL and Redis separately, then:
python manage.py migrate
python manage.py runserver
```

### 3. Frontend

```
cd frontend
pnpm install
pnpm run dev
```

**Note**: For local backend development, you'll need PostgreSQL 17 and Redis 7.4 running separately.

## Project Structure

```
ruffles/
├── backend/              # Django REST API (Dockerized)
│   ├── apps/            # Django apps (authentication, raffles, purchases, payments, common)
│   ├── config/          # Settings & URL routing
│   └── manage.py
├── frontend/            # React SPA (Local development)
│   ├── src/
│   ├── public/
│   └── package.json
└── compose.yaml   # Backend + Database orchestration
```

## API Documentation

Once backend is running, access:
- **Swagger/OpenAPI**: http://localhost:8000/api/schema/swagger/
- **ReDoc**: http://localhost:8000/api/schema/redoc/
- **Admin Panel**: http://localhost:8000/admin/

## Development Workflow

```
# View logs
docker compose logs -f django

# Run Django commands
docker compose exec django python manage.py <command>

# Access Django shell
docker compose exec django python manage.py shell

# Stop services
docker compose down
```