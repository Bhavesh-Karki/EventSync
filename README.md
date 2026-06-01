<div align="center">

#  [EventSync](https://eventsync-seven.vercel.app/)

### Streamlined Event & Volunteer Management System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-eventsync--seven.vercel.app-4CAF50?style=for-the-badge&logo=vercel)](https://eventsync-seven.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

A full-stack web application for managing events, coordinating volunteers, and tracking assignments — with a responsive interface for both admins and volunteers.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🌟 Overview

EventSync is a role-based event and volunteer coordination platform. Admins can create events, onboard volunteers, assign duties, and generate reports — all from a clean dashboard. Volunteers get a personal view of their assignments and statuses.

The app is fully responsive, working cleanly on mobile, tablet, and desktop.

---

## ✨ Features

### 👨‍💼 Admin Dashboard
- **Overview** — Live stats for total events, volunteers, assignments, and completion rate
- **Manage Events** — Create, edit, and delete events with date and description
- **Manage Volunteers** — Register and manage volunteer profiles with contact details and skills
- **Assignments** — Assign volunteers to events with specific duties; update or remove assignments
- **Reports** — Export assignment reports as PDF; view assignment stats by event or volunteer

### 👤 Volunteer Dashboard
- Personal assignment list with event name, duty, and current status
- Status tracking: `Pending`, `In Progress`, `Completed`
- No-password demo login — select your account from the dropdown

### 📱 Responsive Design
- Mobile-first sidebar with hamburger navigation
- Tap-outside-to-close overlay, animated slide-in menu
- Consistent UI across all screen sizes (320px → desktop)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Axios, CSS Variables |
| **Backend** | Node.js, Express.js |
| **Database** | Supabase (PostgreSQL) |
| **Styling** | Custom CSS with centralized design tokens (`theme.css`) |
| **Icons** | Font Awesome 6 |
| **Dev Tools** | Nodemon, Concurrently |
| **Deployment** | Vercel (frontend), Railway / Render (backend) |

---

## 📁 Project Structure

```
EventSync/
├── frontend/                   # React client
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── Login.js        # Role-based login with custom dropdown
│       │   ├── Login.css       # Login page styles (scoped)
│       │   ├── AdminDashboard.js
│       │   └── VolunteerDashboard.js
│       ├── App.js              # Route logic & auth state
│       ├── App.css             # Layout & component styles
│       ├── theme.css           # Centralized design tokens (colors, spacing, typography)
│       ├── api.js              # Axios instance with base URL
│       └── index.js
│
└── backend/                    # Node/Express API
    ├── config/
    │   └── database.js         # Supabase connection
    ├── controllers/
    │   ├── eventController.js
    │   ├── volunteerController.js
    │   ├── assignmentController.js
    │   └── systemController.js
    ├── routes/
    │   ├── eventRoutes.js
    │   ├── volunteerRoutes.js
    │   ├── assignmentRoutes.js
    │   ├── reportRoutes.js
    │   └── systemRoutes.js
    ├── utils/
    │   ├── pdfReport.js        # PDF generation for reports
    │   ├── validators.js
    │   └── supabaseRecords.js
    └── server.js               # Express entry point (port 8000)
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v16 or higher
- [npm](https://npmjs.com) v8 or higher
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/Bhavesh-Karki/EventSync.git
cd EventSync
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (see [Environment Variables](#-environment-variables)).

```bash
# Start backend in development mode (with hot reload)
npm run dev

# Or start in production mode
npm start
```

Backend runs on **http://localhost:8000**

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
npm start
```

Frontend runs on **http://localhost:3000** and proxies API calls to port 8000 automatically.

### 4. Run Both Together (from `/backend`)

```bash
npm run dev-all
```

---

## 🔑 Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# Server
PORT=8000
```

> **Where to find these:** Go to your Supabase project → Settings → API → copy the Project URL and `anon` public key.

---

## 📡 API Reference

Base URL: `http://localhost:8000/api`

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/events` | Get all events |
| `POST` | `/events` | Create a new event |
| `PUT` | `/events/:id` | Update an event |
| `DELETE` | `/events/:id` | Delete an event |

### Volunteers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/volunteers` | Get all volunteers |
| `GET` | `/volunteers/:id` | Get volunteer by ID |
| `POST` | `/volunteers` | Register a volunteer |
| `PUT` | `/volunteers/:id` | Update volunteer info |
| `DELETE` | `/volunteers/:id` | Remove a volunteer |

### Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/assignments` | Get all assignments |
| `GET` | `/assignments/stats` | Get assignment statistics |
| `GET` | `/assignments/volunteer/:volunteerId` | Get assignments for a volunteer |
| `POST` | `/assignments` | Create an assignment |
| `PATCH` | `/assignments/:id/status` | Update assignment status |
| `PUT` | `/assignments/:id` | Update assignment details |
| `DELETE` | `/assignments/:id` | Delete an assignment |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports` | Generate and download PDF report |

---


## 🌐 Deployment

### Frontend — Vercel

1. Push your code to GitHub
2. Import the repo into [Vercel](https://vercel.com)
3. Set the **Root Directory** to `frontend`
4. Vercel auto-detects Create React App — no build config needed
5. Add an environment variable: `REACT_APP_API_URL=https://your-backend-url.com`

### Backend — Railway / Render

1. Create a new project on [Railway](https://railway.app) or [Render](https://render.com)
2. Connect your GitHub repo, set root to `backend`
3. Set start command: `node server.js`
4. Add all environment variables from `.env`
5. Copy the deployed URL and update `REACT_APP_API_URL` in your Vercel frontend

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add: your feature description'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please keep PRs focused — one feature or fix per PR.

---

## 👤 Author

**Bhavesh Karki**

- GitHub: [@Bhavesh-Karki](https://github.com/Bhavesh-Karki)
- Live App: [eventsync-seven.vercel.app](https://eventsync-seven.vercel.app)

---

<div align="center">

Made with ❤️ using React & Node.js

</div>
