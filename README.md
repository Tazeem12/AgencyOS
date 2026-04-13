# Codence Fullstack Task

Codence Fullstack Task is an internal agency workspace for managing clients, projects, tasks, dashboard metrics, and activity history. The app uses Supabase for passwordless email authentication and Postgres storage, with Next.js App Router handling the frontend and API layer.

**Live app:** 

## Tech Stack

- **Next.js** 16.2.3 (App Router) · **React** 19.2.4 · **TypeScript** 5
- **Supabase** (Postgres + Auth) · **Zustand** 5.0.12 (client state)
- **Tailwind CSS** 4 · **Lucide React** 1.8.0 · **Sonner** 2.0.7
- **Date-fns** 4.1.0 · **Clsx** 2.1.1 · **Tailwind Merge** 3.5.0

## Prerequisites

Make sure you have the following installed on your machine:

Git
Node.js
A [Supabase](https://supabase.com) project

## Setup

1. **Clone** the repository and install dependencies:
   ```bash
   git clone https://github.com/Tazeem12/.git
   cd 
   npm install
   ```

2. **Environment variables** — fill in `.env.local :
   | Variable | Description |
   |----------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL (Settings → API) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` **public** key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` **secret** — server-only; required for sign-up (Admin API) and API routes |

3. **Database schema** — in Supabase → **SQL Editor**, run the script:
   `scripts/setup-database.sql`
   This creates tables (`clients`, `projects`, `tasks`, `activity_logs`), RLS policies, indexes, triggers for `updated_at`, and a trigger to set a project to "completed" when all its tasks are "done".

4. **Auth** — in Supabase → **Authentication** → **Providers**, ensure **Email** is enabled.

   For passwordless OTP:
   - enable Supabase Email auth
   - include `{{ .Token }}` in the passwordless email template
   - configure SMTP if you are not using Supabase's default sender

5. **Run locally**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).


## Project Structure

- `app/` - Next.js app directory with pages and API routes
- `components/` - Reusable React components (views, modals, UI elements)
- `hooks/` - Custom React hooks
- `lib/` - Utility libraries (auth, store, validation, Supabase client)
- `public/` - Static assets
- `scripts/` - Database setup scripts

## Important Components

### Authentication

- `components/advanced-auth.tsx` - email entry and OTP verification UI
- `lib/auth-context.tsx` - Supabase auth state, OTP send/verify, logout, refresh
- `lib/supabase.ts` - browser client setup for Supabase
- `app/api/auth/metadata/route.ts` - auth activity logging
- `app/api/auth/logout/route.ts` - logout acknowledgement endpoint

### Main Workspace

- `components/dashboard-view.tsx` - dashboard metrics and recent activity
- `components/clients-view.tsx` - client listing and management
- `components/projects-view.tsx` - project listing and management
- `components/kanban-view.tsx` - task board with status-based organization
- `components/activity-view.tsx` - activity history screen
- `components/trash-view.tsx` - restore and permanent delete flows

## Features

- Passwordless email authentication with 6-digit OTP
- Session persistence with Supabase browser auth
- Auth activity tracking in `activity_logs`
- Client, project, and task management
- Kanban board for task visualization
- Activity logging and trash/recovery system
- Search and filtering capabilities
- Responsive design with Tailwind CSS

## Authentication System

The app uses **Supabase passwordless email OTP** as the only authentication flow.

### Auth flow

1. The user enters an email address in the auth screen.
2. `lib/auth-context.tsx` sends the OTP with `supabase.auth.signInWithOtp(...)`.
3. Supabase emails a 6-digit verification code.
4. The user enters the code in `components/advanced-auth.tsx`.
5. `lib/auth-context.tsx` verifies the code with `supabase.auth.verifyOtp(...)`.
6. On success, the Supabase session is stored in the browser.
7. The app logs the sign-in via `/api/auth/metadata` into `activity_logs`.

### Authentication files

| Path | Responsibility |
|------|----------------|
| `components/advanced-auth.tsx` | Email + OTP login UI |
| `lib/auth-context.tsx` | Auth state, OTP send/verify, logout, refresh |
| `lib/supabase.ts` | Browser Supabase client |
| `lib/auth-fetch.ts` | Adds bearer token to authenticated API calls |
| `app/api/auth/metadata/route.ts` | Stores successful auth activity |
| `app/api/auth/logout/route.ts` | Logout acknowledgement route |
| `app/api/auth/login/route.ts` | Compatibility route, not used for live sign-in |
| `app/api/auth/signup/route.ts` | Compatibility route, not used for live sign-in |

### What gets tracked

Successful logins are written to `activity_logs` with:

- `user_id`
- `entity_type`
- `entity_id`
- `action`
- `description`
- `metadata`

## API Endpoints

### Authentication

#### POST /api/auth/logout
Logs out the current user.
- **Response**: `{ "message": "Logged out successfully" }`

#### POST /api/auth/metadata
Stores a successful authentication event in `activity_logs`.
- **Headers**: `Authorization: Bearer <access_token>`
- **Body**: `{ "event": "login", "metadata": { "method": "otp", "email": "string" } }`
- **Response**: `{ "success": true }`

### Clients

#### GET /api/clients
Retrieves all clients for the authenticated user.
- **Query Params**: `includeDeleted` (boolean), `search` (string)
- **Response**: Array of client objects

#### POST /api/clients
Creates a new client.
- **Body**: `{ "name": "string", "company": "string", "email": "string", "phone": "string" }`
- **Response**: Created client object

#### GET /api/clients/[id]
Retrieves a specific client.
- **Response**: Client object

#### PUT /api/clients/[id]
Updates a specific client.
- **Body**: `{ "name": "string", "company": "string", "email": "string", "phone": "string" }`
- **Response**: Updated client object

#### DELETE /api/clients/[id]
Soft deletes a client (moves to trash).
- **Query Params**: `permanent` (boolean) for permanent deletion
- **Response**: `{ "success": true }`

#### PATCH /api/clients/[id]
Restores a soft-deleted client.
- **Body**: `{ "restore": true }`
- **Response**: Restored client object

### Projects

#### GET /api/projects
Retrieves all projects for the authenticated user.
- **Query Params**: `includeDeleted` (boolean), `search` (string), `status` (string), `clientId` (string)
- **Response**: Array of project objects

#### POST /api/projects
Creates a new project.
- **Body**: `{ "title": "string", "description": "string", "clientId": "string" }`
- **Response**: Created project object

#### GET /api/projects/[id]
Retrieves a specific project.
- **Response**: Project object

#### PUT /api/projects/[id]
Updates a specific project.
- **Body**: `{ "title": "string", "description": "string", "status": "string" }`
- **Response**: Updated project object

#### DELETE /api/projects/[id]
Soft deletes a project.
- **Query Params**: `permanent` (boolean)
- **Response**: `{ "success": true }`

#### PATCH /api/projects/[id]
Restores a soft-deleted project.
- **Body**: `{ "restore": true }`
- **Response**: Restored project object

### Tasks

#### GET /api/tasks
Retrieves all tasks for the authenticated user.
- **Query Params**: `includeDeleted` (boolean), `search` (string), `status` (string), `priority` (string), `projectId` (string)
- **Response**: Array of task objects

#### POST /api/tasks
Creates a new task.
- **Body**: `{ "title": "string", "description": "string", "projectId": "string", "priority": "string" }`
- **Response**: Created task object

#### GET /api/tasks/[id]
Retrieves a specific task.
- **Response**: Task object

#### PUT /api/tasks/[id]
Updates a specific task.
- **Body**: `{ "title": "string", "description": "string", "status": "string", "priority": "string" }`
- **Response**: Updated task object

#### DELETE /api/tasks/[id]
Soft deletes a task.
- **Query Params**: `permanent` (boolean)
- **Response**: `{ "success": true }`

#### PATCH /api/tasks/[id]
Restores a soft-deleted task.
- **Body**: `{ "restore": true }`
- **Response**: Restored task object

### Activity Logs

#### GET /api/activity
Retrieves activity logs for the authenticated user.
- **Query Params**: `limit` (number), `offset` (number)
- **Response**: Array of activity log objects

### Statistics

#### GET /api/stats
Retrieves dashboard statistics for the authenticated user.
- **Response**: `{ "totalClients": number, "totalProjects": number, "totalTasks": number, "completedTasks": number, "activeProjects": number }`

## Database Schema

The application uses PostgreSQL via Supabase with the following tables:

### clients
- `id` (UUID, Primary Key)
- `name` (TEXT, NOT NULL)
- `company` (TEXT, NOT NULL)
- `email` (TEXT, NOT NULL)
- `phone` (TEXT)
- `user_id` (UUID, NOT NULL, Foreign Key to auth.users)
- `is_deleted` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### projects
- `id` (UUID, Primary Key)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `status` (TEXT, CHECK: 'planning'|'active'|'completed', DEFAULT 'planning')
- `client_id` (UUID, NOT NULL, Foreign Key to clients)
- `user_id` (UUID, NOT NULL, Foreign Key to auth.users)
- `is_deleted` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### tasks
- `id` (UUID, Primary Key)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `status` (TEXT, CHECK: 'todo'|'in-progress'|'done', DEFAULT 'todo')
- `priority` (TEXT, CHECK: 'low'|'medium'|'high', DEFAULT 'medium')
- `project_id` (UUID, NOT NULL, Foreign Key to projects)
- `user_id` (UUID, NOT NULL, Foreign Key to auth.users)
- `is_deleted` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### activity_logs
- `id` (UUID, Primary Key)
- `user_id` (UUID, NOT NULL, Foreign Key to auth.users)
- `action` (TEXT, NOT NULL)
- `entity_type` (TEXT, NOT NULL)
- `entity_id` (UUID)
- `description` (TEXT, NOT NULL)
- `metadata` (JSONB, DEFAULT '{}')
- `created_at` (TIMESTAMP)

### Key Features
- **Row Level Security (RLS)**: All tables have RLS enabled with policies ensuring users can only access their own data.
- **Indexes**: Optimized indexes on user_id, status, and other frequently queried fields.
- **Triggers**: Automatic `updated_at` updates and project completion logic when all tasks are done.
- **Soft Delete**: `is_deleted` flag for trash/recovery functionality.

## Deployment

The application can be deployed to Vercel, Netlify, or any platform supporting Next.js. Ensure environment variables are set in the deployment platform.

**Live Link**:

## License

This is an internal tool and not licensed for external use.
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Project layout

| Path | Role |
|------|------|
| `app/page.tsx` | Shell: auth gate, sidebar, view switcher |
| `app/api/**` | REST API (JSON). Auth via `Authorization: Bearer <access_token>` |
| `lib/store.ts` | Zustand store; `authFetch` attaches the session token |
| `lib/auth-context.tsx` | Login / sign-up / session |
| `lib/server/services/` | Server-side domain logic (e.g. dashboard aggregates) |
| `components/*` | UI modules (dashboard, clients, projects, Kanban, activity, trash) |

## API overview

All **data** routes expect a valid Supabase JWT:

```http
Authorization: Bearer <access_token>
```

| Method & path | Description |
|---------------|-------------|
| `POST /api/auth/logout` | Acknowledges logout (client clears session) |
| `POST /api/auth/metadata` | Stores successful auth activity in `activity_logs` |
| `GET/POST /api/clients` | List / create clients. Query: `includeDeleted`, `search` |
| `GET/PUT/PATCH/DELETE /api/clients/[id]` | Read / update / restore (PATCH `{ restore: true }`) / soft or permanent delete (`?permanent=true`) |
| `GET/POST /api/projects` | List / create. Query: `includeDeleted`, `search`, `status`, `clientId` |
| `GET/PUT/PATCH/DELETE /api/projects/[id]` | Project CRUD + restore + status |
| `GET/POST /api/tasks` | List / create. Query: `includeDeleted`, `projectId`, `status`, `priority`, `search` |
| `GET/PUT/PATCH/DELETE /api/tasks/[id]` | Task CRUD; PATCH `{ status }` runs completion checks |
| `GET /api/activity` | Activity log. Query: `limit`, `entityType` |
| `GET /api/stats` | Dashboard aggregates for the current user |

## Database schema (summary)

- **clients** — `name`, `company`, `email`, `phone`, `user_id`, `is_deleted`, timestamps  
- **projects** — `title`, `description`, `status` (`planning` \| `active` \| `completed`), `client_id`, `user_id`, `is_deleted`, timestamps  
- **tasks** — `title`, `description`, `status` (`todo` \| `in-progress` \| `done`), `priority` (`low` \| `medium` \| `high`), `project_id`, `user_id`, `is_deleted`, timestamps  
- **activity_logs** — `action`, `entity_type`, `entity_id`, `description`, `metadata`, `user_id`, `created_at`  

Foreign keys: projects → clients; tasks → projects. All business-owned rows are scoped by `user_id` with RLS; API routes also enforce the user id from the JWT.


## Evaluation alignment (from brief)

- Linked entities with automatic **project → Completed** when all tasks are **Done** (DB + API).
- **Kanban** with columns and **Move** + **drag-and-drop**; status updates persist via API.
- **Dashboard** metrics from `/api/stats`; refreshed after mutations.
- **Activity log**, **search** (clients / projects / task title on Kanban), **filters** (project status, task priority / project).
- **Soft delete** and **trash** with restore and permanent delete.
- **Validation** on auth (client + server for login email).
- **Layered server code**: route handlers call shared **services** where applicable (`lib/server/services/`).

## License

Private / assessment use.
