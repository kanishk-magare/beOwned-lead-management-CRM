# Lead Management System

A full-stack Lead Management System / mini CRM built for a real-estate sales use case. It allows sales teams to create, manage, search, filter, track, and convert property leads through a simple sales pipeline.

Built as a full-stack assignment for **beOwned Spaces Pvt. Ltd.**

## Prerequisites

Only the following are required on your machine:

* **Docker Desktop** with Docker Compose
* **Git**

You do **not** need Node.js, PostgreSQL, or Redis installed locally. Everything runs through Docker.

## Run the Application

### 1. Clone the repository

```bash
git clone https://github.com/kanishk-magare/beOwned-lead-management-CRM.git
cd beOwned-lead-management-CRM
```

### 2. Start the application

```bash
docker compose up --build
```

This starts:

* React frontend
* Node.js/Express backend
* PostgreSQL database
* Redis

The database is initialized automatically with sample data.

### 3. Open the application

**Frontend:**
http://localhost:5173

**Backend API:**
http://localhost:5000/api

**Health Check:**
http://localhost:5000/api/health

### Useful Docker Commands

Run in background:

```bash
docker compose up --build -d
```

View logs:

```bash
docker compose logs -f
```

Stop the application:

```bash
docker compose down
```

Reset the database:

```bash
docker compose down -v
```

> `docker compose down -v` removes the PostgreSQL volume and resets the database on the next startup.

---

## Architecture

The application follows a simple **React + Node.js + PostgreSQL** architecture.

```text
                    Browser
                       │
                       ▼
              React / Vite Frontend
                 localhost:5173
                       │
                       │ REST API
                       ▼
              Node.js + Express API
                 localhost:5000
                    │       │
          ┌─────────┘       └──────────┐
          ▼                            ▼
     PostgreSQL                       Redis
      Database                       BullMQ
          │                            │
          │                            ▼
          │                    Background Workers
          │                    CSV Import / Export
          ▼
      Lead & Note Data
```

### Backend

The backend is structured into:

* **Routes** – API endpoint definitions
* **Controllers** – Request/response handling
* **Services** – Business logic and database operations
* **Models** – Sequelize database models
* **Validators** – Zod request validation
* **Workers** – Background CSV processing
* **Middleware** – Validation and centralized error handling

### Background Processing

CSV imports and exports are handled asynchronously using **BullMQ + Redis**.

For CPU-heavy CSV operations, Node.js **Worker Threads** are used so that large files do not block the main API process.

### Database

PostgreSQL stores:

* Leads
* Lead requirements
* Pipeline status
* Follow-up notes

Sequelize is used as the ORM.

---

## Main Features

### Lead Management

* Create, update and delete leads
* View detailed lead information
* Update pipeline status
* Prevent duplicate phone numbers and emails

### Search & Filters

* Search by name, phone or location
* Filter by source and status
* Sort by budget or creation date
* Pagination
* Search/filter state is synchronized with the URL

### Lead Timeline

Each lead can have follow-up notes with timestamps, allowing sales users to track interactions.

### Dashboard

Provides:

* Total leads
* Closed leads
* Conversion rate
* Average budget
* Total closed value
* Lead source distribution
* Pipeline/status distribution
* Recent leads

### CSV Import & Export

* Download sample CSV template
* Bulk import leads
* Background processing with BullMQ
* Validation with row-level error reporting
* Download rejected rows with error reasons
* Export filtered leads to CSV

---

## API Overview

### Leads

| Method | Endpoint                | Description                             |
| ------ | ----------------------- | --------------------------------------- |
| GET    | `/api/leads`            | List, search, filter and paginate leads |
| POST   | `/api/leads`            | Create a lead                           |
| GET    | `/api/leads/:id`        | Get lead details                        |
| PATCH  | `/api/leads/:id`        | Update lead                             |
| PATCH  | `/api/leads/:id/status` | Update pipeline status                  |
| DELETE | `/api/leads/:id`        | Delete lead                             |
| GET    | `/api/leads/export-csv` | Export filtered leads                   |

### Notes

| Method | Endpoint                       | Description          |
| ------ | ------------------------------ | -------------------- |
| GET    | `/api/leads/:id/notes`         | Get lead notes       |
| POST   | `/api/leads/:id/notes`         | Add a follow-up note |
| DELETE | `/api/leads/:id/notes/:noteId` | Delete a note        |

### CSV Import

| Method | Endpoint                                      | Description            |
| ------ | --------------------------------------------- | ---------------------- |
| GET    | `/api/leads/sample-csv`                       | Download sample CSV    |
| POST   | `/api/leads/upload-csv`                       | Upload CSV             |
| GET    | `/api/leads/import-status/:jobId`             | Check import progress  |
| GET    | `/api/leads/import-status/:jobId/invalid-csv` | Download rejected rows |

### Dashboard & Utilities

| Method | Endpoint                        | Description                |
| ------ | ------------------------------- | -------------------------- |
| GET    | `/api/dashboard/stats`          | Dashboard metrics          |
| GET    | `/api/locations/search?q=query` | Location autocomplete      |
| GET    | `/api/meta`                     | Available dropdown options |
| GET    | `/api/health`                   | API/database health check  |

---

## Tech Stack

**Frontend**

* React 18
* Vite
* React Router
* Tailwind CSS
* Lucide React

**Backend**

* Node.js 20
* Express.js
* Sequelize
* Zod
* BullMQ
* Worker Threads

**Infrastructure**

* PostgreSQL 16
* Redis 7
* Docker & Docker Compose

**External Service**

* OpenStreetMap Nominatim for location suggestions

---

## Project Structure

```text
beOwned-lead-management-CRM/
│
├── client/                 # React frontend
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       └── utils/
│
├── server/                 # Express backend
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── db/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── validators/
│       └── workers/
│
├── docker-compose.yml
├── dump.sql
├── .env.example
└── README.md
```

## Configuration

The Docker setup contains default configuration, so the application can be started without manually creating environment variables.

For custom configuration:

```bash
cp .env.example .env
```

The main variables include database, Redis, API port, CORS, and frontend API URL settings.

## Assumptions

* The application is designed as an **internal CRM**, so authentication is outside the assignment scope.
* All budgets are stored in **Indian Rupees (₹)**.
* Phone numbers and emails are unique per lead.
* CSV imports are processed asynchronously to keep the API responsive.
