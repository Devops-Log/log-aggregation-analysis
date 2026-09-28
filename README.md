# CentralLog - Log Aggregation and Analysis Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

**CentralLog** is a high-performance, full-stack log aggregation, monitoring, and analytics platform built for DevOps engineers, SREs, and developers. It provides centralized log collection across microservices, real-time metrics visualizers, full-text log search, severity breakdown, time-series metrics charts, and structured metadata inspection.

---

## 🚀 Features

- 📊 **Interactive Monitoring Dashboard**: Live time-series graphs, error rate indicators, critical incident alerts, and service distribution metrics powered by **Recharts**.
- 🔍 **Real-Time Log Filtering & Search**: Filter logs instantly by microservice name, severity level (`INFO`, `WARN`, `ERROR`, `CRITICAL`), or keyword search.
- ⚡ **High-Performance Backend**: Built with Express 5, TypeScript, and Mongoose indexing (`timestamp`, `service`, `level`) for fast query execution.
- 🔒 **Secure Authentication**: JWT-based user authentication and encrypted password hashing using `bcryptjs`.
- 📁 **Structured Metadata Inspector**: Deep dive into individual log items with collapsible JSON metadata view.
- 🧪 **Built-in Mock Log Generator**: One-click log seeding endpoint to populate realistic microservice telemetry for immediate testing and demo.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Charts & UI**: Recharts, Lucide React Icons
- **State & Routing**: React Context API, React Router DOM

### Backend
- **Runtime**: Node.js
- **Framework**: Express 5
- **Language**: TypeScript (`tsx` runtime watcher)
- **Database**: MongoDB + Mongoose ORM
- **Validation & Auth**: Zod, JSON Web Token (JWT), bcryptjs

---

## 📁 Project Structure

```text
Log_Aggregation_and_Analysis/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection setup
│   │   ├── controllers/     # Auth and Log business logic
│   │   ├── models/          # Mongoose schemas (Log, User)
│   │   ├── routes/          # Express route definitions
│   │   └── server.ts        # Server entry point
│   ├── .env                 # Environment configurations
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Navbar, etc.)
│   │   ├── context/         # AuthContext & state providers
│   │   ├── pages/           # DashboardPage & LoginPage
│   │   ├── App.tsx          # Main React router container
│   │   └── main.tsx         # React application entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (running locally on port `27017` or a MongoDB Atlas URI)

---

### Installation & Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Devops-Log/log-aggregation-analysis.git
cd log-aggregation-analysis
```

#### 2. Configure & Run Backend

Navigate to the `backend` directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (or use default dev values):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/centrallog
JWT_SECRET=centrallog_devops_secret_jwt_2026
CORS_ORIGIN=http://localhost:5173
```

Start the backend development server:
```bash
npm run dev
```
The server will run on `http://localhost:5000`.

---

#### 3. Configure & Run Frontend

Open a new terminal window, navigate to the `frontend` directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The application UI will be available at `http://localhost:5173`.

---

## 📡 API Reference

### Health Check
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Returns server health status and timestamp |

### Authentication Routes (`/api/v1/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Authenticate user and receive JWT token |

### Log Routes (`/api/v1/logs`)
| Method | Endpoint | Query / Body Params | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/logs` | `page`, `limit`, `search`, `service`, `level` | Fetch paginated log entries with filters |
| `POST` | `/api/v1/logs` | `{ service, level, message, metadata }` | Ingest a new log entry |
| `GET` | `/api/v1/logs/metrics` | None | Get aggregate stats, error rates, & time-series data |
| `POST` | `/api/v1/logs/seed` | `{ count?: number }` | Generate mock log entries for testing |

---

## 🧪 Seeding Sample Data

To quickly evaluate the dashboard visuals:
1. Log in to the application dashboard.
2. Click the **"Seed Mock Logs"** button in the dashboard header or trigger the POST endpoint:
```bash
curl -X POST http://localhost:5000/api/v1/logs/seed
```
This populates sample logs from microservices like `auth-service`, `payment-gateway`, `user-service`, `order-service`, and `notification-worker`.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
