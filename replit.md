# GenieSugar - Diabetes Management Application

## Overview

GenieSugar is a comprehensive diabetes management platform built with a React frontend and Express backend. The application enables patients to track glucose readings, food intake, and physical activities while allowing healthcare providers (physicians and dietitians) to monitor their patients' health data. The system includes role-based access control with four user types: patients, physicians, dietitians, and administrators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Design System**: Material Design 3 with healthcare optimization - prioritizes clarity, accessibility, and data hierarchy for medical applications
- **Theme Support**: Light/dark mode with CSS variables and context-based theme switching
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based auth using express-session with SHA-256 password hashing
- **API Design**: RESTful endpoints under `/api` prefix
- **File Structure**: Monorepo with `client/`, `server/`, and `shared/` directories

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all table definitions and Zod validation schemas
- **Key Tables**: users, glucoseReadings, foodLogs, activityLogs, careTeam, providerNotes, auditLogs, appointments
- **Migrations**: Managed via `drizzle-kit push` command

### Authentication & Authorization
- **Session Management**: express-session with 24-hour cookie expiration
- **Role-Based Access**: Four roles (patient, physician, dietitian, admin) with different dashboard views and permissions
- **Protected Routes**: Frontend uses `ProtectedRoute` component with role-based redirects
- **Care Team Model**: Providers can be linked to patients with configurable permissions (glucose-only or all data)

### Key Design Patterns
- **Shared Types**: TypeScript types and Zod schemas shared between frontend and backend via `@shared/*` path alias
- **API Client**: Centralized `apiRequest` function with credentials handling
- **Component Library**: shadcn/ui components with Radix UI primitives
- **Layout System**: `DashboardLayout` wrapper component with sidebar navigation

## External Dependencies

### Database
- PostgreSQL (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database queries
- connect-pg-simple for session storage

### UI Components
- Radix UI primitives (dialogs, dropdowns, forms, etc.)
- Recharts for data visualization (glucose charts, trends)
- Lucide React for icons
- class-variance-authority for component variants
- date-fns for date formatting

### Development Tools
- Vite for frontend bundling with HMR
- esbuild for server bundling (production builds)
- TypeScript with strict mode
- Replit-specific plugins for development experience

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption (optional, has default for development)