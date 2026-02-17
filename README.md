# Snappy Monorepo

A monorepo containing both backend and frontend applications for the Snappy project.

## Full Project Documentation (KT)

For detailed top-down knowledge transfer documentation (architecture, flows, module-level how/when/where/why, and diagrams), see:

- `docs/KT_GUIDE.md`
- `docs/kt/README.md` (flow-based multi-file KT set)

## Project Structure

```
snappy-monorepo/
├── apps/
│   ├── backend/          # Node.js + Express + TypeScript + PostgreSQL
│   └── frontend/         # React + Vite + TypeScript + SWC + Tailwind v4 + shadcn/ui
├── packages/
│   └── shared-types/     # Shared TypeScript types for both apps
├── package.json          # Root workspace configuration
└── README.md            # This file
```

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL (for backend)
- npm or yarn

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` files in both backend and frontend apps
   - Configure your database connection in backend

3. **Start development servers:**
   ```bash
   npm run dev
   ```

## Available Scripts

### Root Level
- `npm run dev` - Start both backend and frontend in development mode
- `npm run dev:backend` - Start only backend
- `npm run dev:frontend` - Start only frontend
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run format` - Format all packages
- `npm run test` - Run tests for all packages
- `npm run setup` - Run the setup script
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run test` - Run tests

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format with Prettier

### Shared Types
- `npm run build` - Build the shared types package
- `npm run dev` - Watch mode for development

## Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod + express-validator
- **Testing:** Jest + Supertest
- **Authentication:** JWT

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Compiler:** SWC
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **State Management:** React Query
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Linting:** ESLint
- **Formatting:** Prettier
- **Testing:** Vitest

### Shared
- **Types:** TypeScript interfaces shared between frontend and backend
- **API Contracts:** Consistent API response types
- **Validation:** Shared validation schemas

## Development

### Backend Development
The backend runs on `http://localhost:3000` by default.

### Frontend Development
The frontend runs on `http://localhost:5173` by default.

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/snappy_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Snappy
```

## Database Setup

1. Install PostgreSQL
2. Create a database named `snappy_db`
3. Update the `DATABASE_URL` in backend `.env`
4. Run migrations: `npm run db:migrate`

## Shared Types

The `packages/shared-types` package contains TypeScript interfaces and types that are shared between the frontend and backend applications. This ensures type safety and consistency across the entire application.

### Key Features:
- **User Types:** User interface, authentication requests/responses
- **API Types:** Standardized API response formats
- **Form Types:** Form validation and state types
- **Error Types:** Consistent error handling types

## Production Deployment

Zero-downtime deploys via Docker Compose:

```bash
./deploy.sh
```

**Requirements:** Docker, docker-compose, `apps/backend/.env` and `apps/frontend/.env` with production values.

**Options:**
- `APP_PORT=80` - Nginx port (default: 80)
- `NO_CACHE=1` - Full rebuild without cache
- `REBUILD_NGINX=1` - Rebuild nginx (after nginx.conf changes)
- `SKIP_MIGRATE=1` - Skip database migrations
- `DRY_RUN=1` - Validate only, don't deploy

**First deploy:** Run `docker-compose down` once if migrating from an older setup.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request

## License

MIT
