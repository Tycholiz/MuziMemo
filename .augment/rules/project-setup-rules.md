---
type: 'manual'
---

# Project Setup Rules

## Backend (Express Server) Guidelines

### Project Structure

At the root level (alongside `src`), include:

- `db/`: A standalone Node project using Graphile Migrate for Postgres migrations.
- `infra/`: All Terraform infrastructure-as-code files.

#### Directory Structure

src/  
├── app.ts # Application entry point  
├── routes/ # Route definitions  
├── controllers/ # Request handlers  
├── datasources/ # Data access layer  
├── customTypes/ # TypeScript type definitions  
├── utils/ # Utility functions and helpers  
├── loaders/ # Application initialization modules  
└── services/ # Business logic layer (optional)

### app.ts Setup

- Single entry point
- Uses modular loader system
- Registers routes
- Loads environment variables via dotenv
- Handles errors explicitly

Example:

import express from 'express'  
import loaders from './loaders'  
import routes from './routes'

const startServer = async () => {
const app = express()
await loaders(app)
registerRoutes(app)
handleErrors(app)
}

### Loaders

- Modular, single-responsibility
- Centralized in `loaders/index.ts`

Example:

export default async (app: Express) => {
await databaseLoader()
await expressLoader(app)
await authLoader(app)
}

### Routes

- Files named `{resource}.route.ts`
- REST-style noun-based paths

Example:

import { Router } from 'express'  
import controller from '../controllers/resource.controller'

const router = Router()
router.get('/', requireAuth(), controller.method)
export default router

### Controllers

- Files named `{resource}.controller.ts`
- Class-based, one method per route

Example:

class ResourceController {
async method(req: Request, res: Response) {
try {
res.status(200).json(result)
} catch (error) {
res.status(500).json({ error })
}
}
}

### Data Sources

Example:

export class ResourceDataSource {
async method(params) {
const db = new DBClient()
return await db.query(
'select \* from app_public.resource',
[params]
)
}
}

### Database Conventions

Use `app_public` schema for application tables.

Example:

const result = await db.query(
'select app_public.function_name($1, $2)',
[param1, param2]
)

### Authentication (Clerk)

Use middleware at the route level.

Example:

router.post('/resource', requireAuth(), controller.method)

### Environment Configuration

Example:

import 'dotenv/config'

const config = {
port: process.env.PORT || 3000,
dbUrl: process.env.DATABASE_URL
}

### Logging

Example:

import { logger } from '../utils/logger'

logger.info('Success', { context })
logger.error('Failure', { error, context })

---

## Mobile (React Native Expo) Guidelines

### File Naming Conventions

- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase (`useUserData.ts`)
- Utils: camelCase (`formatDate.ts`)
- Contexts: PascalCase (`AuthContext.tsx`)
- Stores: camelCase (`userStore.ts`)
- Types: PascalCase (`UserTypes.ts`)

### File Structure

src/  
├── components/**/\*.tsx  
├── hooks/**/_.ts  
├── contexts/\*\*/_.tsx  
├── stores/**/\*.ts  
├── utils/**/_.ts  
├── customTypes/\*\*/_.ts  
├── api/**/\*.ts  
├── db/**/_.ts  
├── tasks/\*\*/_.ts  
\*_/_.test.ts

### Routing

- Use `expo-router`
- All routes go in `src/app/`

### Providers

Wrap `src/app/_layout.tsx` in a single `Providers.tsx` file at the root.

---

## ESLint Setup

Each project should use ESLint with Prettier integration.

### Base ESLint Setup

Install required packages:

```bash
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-plugin-import eslint-plugin-unused-imports

General rules:
- indent size: 2 spaces
- trailing commas on
- avoid semicolons at end of line
- prefer single quotes
```
