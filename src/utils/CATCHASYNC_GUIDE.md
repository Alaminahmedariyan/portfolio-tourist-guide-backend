# CatchAsync Utility - Usage Guide

## Overview

`catchAsync` is an industry-standard utility wrapper for Express async route handlers that eliminates the need for repetitive try-catch blocks. It automatically catches errors and passes them to Express's error handling middleware.

## Why Use catchAsync?

### Without catchAsync (Verbose & Repetitive)

```typescript
router.get("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    res.json(user);
  } catch (error) {
    next(error); // Pass to global error handler
  }
});
```

### With catchAsync (Clean & DRY)

```typescript
router.get(
  "/users/:id",
  catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    res.json(user);
  }),
);
```

## How It Works

The `catchAsync` wrapper:

1. Receives an async handler function
2. Returns a regular Express middleware function
3. Executes the async handler
4. Automatically catches any errors (Promises or thrown exceptions)
5. Passes errors to `next()` middleware for centralized error handling

## Implementation

### Basic Setup

```typescript
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../errors/AppError";
import { Router, Request, Response } from "express";

const router = Router();

// Simple GET handler
router.get(
  "/endpoint",
  catchAsync(async (req, res) => {
    const data = await someAsyncOperation();
    res.json({ success: true, data });
  }),
);
```

### With Error Throwing

```typescript
// Throw AppError for validation failures
router.post(
  "/users",
  catchAsync(async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
      throw new AppError("Name and email required", 400);
    }

    const user = await User.create({ name, email });
    res.status(201).json({ success: true, data: user });
  }),
);
```

### With Database Operations

```typescript
// Prisma queries automatically throw Prisma errors
// These are caught by catchAsync and passed to globalErrorHandler
router.delete(
  "/users/:id",
  catchAsync(async (req, res) => {
    const user = await prisma.user.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: "User deleted" });
  }),
);
```

### With Validation

```typescript
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

router.post(
  "/users",
  catchAsync(async (req, res) => {
    // Zod throws ZodError on validation failure
    // catchAsync catches it and globalErrorHandler formats it
    const validated = userSchema.parse(req.body);

    const user = await User.create(validated);
    res.status(201).json({ success: true, data: user });
  }),
);
```

## Common Patterns

### 1. Resource Not Found

```typescript
catchAsync(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) {
    throw new AppError("Item not found", 404);
  }
  res.json(item);
});
```

### 2. Authorization Check

```typescript
catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  // Continue with operation
  res.json({ success: true });
});
```

### 3. Input Validation

```typescript
catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email.includes("@")) {
    throw new AppError("Invalid email", 400);
  }
  // Process email
  res.json({ success: true });
});
```

### 4. Multiple Async Operations

```typescript
catchAsync(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const posts = await Post.findMany({ userId: user.id });
  const comments = await Comment.findMany({ userId: user.id });

  res.json({
    success: true,
    data: { user, posts, comments },
  });
});
```

## Error Flow

```
Handler throws error (Zod, Prisma, AppError, etc.)
         ↓
catchAsync catches promise rejection or thrown error
         ↓
Passes error to next() middleware
         ↓
Express routes to globalErrorHandler
         ↓
globalErrorHandler formats and sends response
```

## Integration with Global Error Handler

Make sure your Express app has the global error handler set up:

```typescript
import { globalErrorHandler } from "./middlewares/globalErrorHandler";

// ... all routes ...

// Error handler MUST be last
app.use(globalErrorHandler);
```

## Alternative Implementations

### Using Try-Catch Pattern

```typescript
export const catchAsyncTryCatch = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
```

### Using Promise.resolve Pattern (Current Implementation)

```typescript
export const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

Both work identically; choose based on your preference.

## Best Practices

✅ **Do:**

- Use `catchAsync` on every async route handler
- Throw `AppError` with appropriate status codes
- Let catchAsync handle the error passing
- Keep handler logic focused and clean

❌ **Don't:**

- Manually write try-catch in handlers
- Use `next()` directly to pass errors when using catchAsync
- Mix async/await with `.catch()` chains
- Forget to wrap async handlers with catchAsync

## TypeScript Benefits

- Full type safety for Request, Response, NextFunction
- Proper error typing
- IDE autocompletion for Express methods
- Compile-time error detection

## See Also

- [AppError Class](../errors/AppError.ts) - Custom error class
- [Global Error Handler](../middlewares/globalErrorHandler.ts) - Centralized error handling
- [Error Handlers](../errors/handlers/) - Specific error type handlers
