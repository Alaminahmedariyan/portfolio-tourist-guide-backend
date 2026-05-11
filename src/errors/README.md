# Error Handling System

## Overview

A comprehensive, modular error handling system for the Tourist Guide API that handles multiple error types including Zod validation, Prisma database errors, custom application errors, and generic errors.

## Directory Structure

```
src/errors/
├── AppError.ts                 # Custom application error class
├── types/
│   └── errorResponse.ts        # ErrorResponse interface definition
├── utils/
│   ├── logger.ts              # Error logging utility
│   └── slack.ts               # Slack notification integration
└── handlers/
    ├── zodErrorHandler.ts     # Zod validation error handler
    ├── prismaErrorHandler.ts  # Prisma database error handlers
    ├── appErrorHandler.ts     # Custom AppError and generic error handlers
    └── index.ts               # Barrel export for all handlers
```

## Key Components

### 1. **AppError Class** (`AppError.ts`)

Custom error class for throwing application-specific errors.

```typescript
throw new AppError("User not found", 404);
throw new AppError("Unauthorized", 401);
```

### 2. **Error Types** (`types/errorResponse.ts`)

Defines the standard error response structure with metadata.

### 3. **Error Handlers** (`handlers/`)

- **zodErrorHandler.ts**: Handles Zod validation errors with field-level details
- **prismaErrorHandler.ts**: Maps Prisma error codes to user-friendly messages
- **appErrorHandler.ts**: Handles custom AppError and generic errors

### 4. **Utilities** (`utils/`)

- **logger.ts**: Logs errors with context (method, path, timestamp, stack trace)
- **slack.ts**: Sends critical error notifications to Slack webhook

## Error Types Handled

| Error Type            | Status Code | Details                                                |
| --------------------- | ----------- | ------------------------------------------------------ |
| Zod Validation        | 400         | Field-level validation errors                          |
| Prisma Validation     | 400         | Invalid query structure                                |
| Prisma Known Errors   | 400/404/409 | Database constraint violations, record not found, etc. |
| Prisma Initialization | 503         | Database connection failed                             |
| AppError              | Variable    | Custom application errors                              |
| Generic Error         | 500         | Unexpected errors                                      |

## Prisma Error Code Mapping

| Code  | Message                       | Status |
| ----- | ----------------------------- | ------ |
| P2000 | Value too long for field      | 400    |
| P2002 | Unique constraint violation   | 409    |
| P2003 | Foreign key constraint failed | 400    |
| P2014 | Required relation violation   | 400    |
| P2025 | Record not found              | 404    |

## Usage

### In Express Server

```typescript
import { globalErrorHandler } from "./middlewares/globalErrorHandler";

// Add at the END of all routes and middlewares
app.use(globalErrorHandler);
```

### Throwing Custom Errors

```typescript
import { AppError } from "./errors/AppError";

// In route handlers
if (!user) {
  throw new AppError("User not found", 404);
}
```

## Slack Integration

Set the `SLACK_WEBHOOK_URL` environment variable to enable Slack notifications for critical (5xx) errors:

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Features

✅ **Modular Design** - Each error type has its own handler  
✅ **Type-Safe** - Full TypeScript support  
✅ **Centralized Logging** - Easy to integrate Winston, Pino, etc.  
✅ **Slack Integration** - Critical error notifications  
✅ **User-Friendly Messages** - Environment-aware error messages  
✅ **Request Context** - Includes path, method, and timestamp  
✅ **Extensible** - Easy to add new error handlers
