# Task Management Platform

A full-stack task management platform built with React, NestJS, and Prisma.

## Features

- User authentication and authorization
- Project management
- Task management with priorities and status
- User profile management
- Responsive UI with Mantine components

## Tech Stack

### Frontend
- React with TypeScript
- Mantine UI components
- React Router for navigation
- Zustand for state management
- React Query for data fetching

### Backend
- NestJS with TypeScript
- Prisma as ORM
- PostgreSQL database
- JWT authentication
- REST API

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd task-management-platform
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:
```bash
# Backend (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/taskdb"
JWT_SECRET="your-jwt-secret"
PORT=3000

# Frontend (.env)
VITE_API_URL="http://localhost:3000"
```

4. Run database migrations:
```bash
cd backend
npx prisma migrate dev
```

5. Start the development servers:
```bash
# Start backend (from backend directory)
npm run start:dev

# Start frontend (from frontend directory)
npm run dev
```

## Project Structure

```
task-management-platform/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── users/
│   │   └── prisma/
│   └── prisma/
│       └── schema.prisma
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── hooks/
    │   ├── pages/
    │   └── types/
    └── index.html
```

## License

This project is licensed under the MIT License. 