# Server Error Handling & Graceful Shutdown Guide

## Overview

The enhanced `server.ts` implements industry-standard error handling and graceful shutdown mechanisms for production Express applications. It handles:

1. **Uncaught Exceptions** - Synchronous errors outside async/await
2. **Unhandled Promise Rejections** - Promises that reject without handlers
3. **SIGINT** - User interruption (Ctrl+C)
4. **SIGTERM** - Process manager termination signals
5. **Graceful Shutdown** - Clean resource cleanup before exit

## Error Handling Mechanisms

### 1. Uncaught Exceptions

```typescript
process.on("uncaughtException", (error: Error) => {
  // Logs error details and gracefully shuts down
});
```

**When triggered:**

- Synchronous errors not in try-catch
- Errors in callbacks not using async/await
- Errors in event handlers

**Example:**

```typescript
// This triggers uncaughtException
JSON.parse("invalid json");

// This also triggers it
throw new Error("Sync error");
```

### 2. Unhandled Promise Rejections

```typescript
process.on("unhandledRejection", (reason, promise) => {
  // Logs rejection details and gracefully shuts down
});
```

**When triggered:**

- Promise rejects without `.catch()`
- Async function throws without try-catch

**Example:**

```typescript
// This triggers unhandledRejection
Promise.reject(new Error("Unhandled rejection"));

// This also triggers it
async function bad() {
  throw new Error("Unhandled");
}
bad(); // Called but not awaited
```

### 3. Signal Handlers

#### SIGINT (Ctrl+C)

```typescript
process.on("SIGINT", () => {
  gracefulShutdown("SIGINT");
});
```

**When triggered:**

- User presses Ctrl+C in terminal
- Manual interruption

#### SIGTERM

```typescript
process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM");
});
```

**When triggered:**

- Container/Docker termination
- Kubernetes pod shutdown
- Process manager (PM2, systemd) termination
- Cloud platform shutdowns (Heroku, AWS, GCP)

## Graceful Shutdown Flow

```
Signal/Error Received
         ↓
Log error details
         ↓
Close HTTP server (accept no new connections)
         ↓
Wait for active connections to close
         ↓
Disconnect from database
         ↓
Exit process (exit code 0 for success, 1 for error)
```

### Timeout Mechanism

If graceful shutdown takes too long (30 seconds), the server force-exits:

```typescript
setTimeout(() => {
  console.error("Graceful shutdown timeout. Force exiting...");
  process.exit(1);
}, 30000); // 30 second timeout
```

## Database Connection Cleanup

The server verifies database connectivity on startup:

```typescript
// Verify database connection
await prisma.$queryRaw`SELECT 1`;
console.log("✅ Database connection verified");
```

On shutdown, it properly disconnects:

```typescript
await prisma.$disconnect();
console.log("✅ Database connection closed");
```

## Port Conflict Handling

Detects when the specified port is already in use:

```typescript
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${config.port} is already in use`);
    process.exit(1);
  }
});
```

## Startup Output

```
✅ Database connection verified
✅ Server started on port 3000 (development mode)
📍 URL: http://localhost:3000
```

## Shutdown Output

```
[SIGINT] Graceful shutdown initiated...
[SIGINT] HTTP server closed
[SIGINT] Database connection closed
[SIGINT] Graceful shutdown completed
```

## Environment Variables

Make sure your `.env` file has:

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/tourist_guide
```

## Exit Codes

| Code | Reason              |
| ---- | ------------------- |
| 0    | Successful shutdown |
| 1    | Error or force exit |

## Integration with Process Managers

### PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "tourist-guide",
      script: "./dist/server.js",
      instances: "max",
      exec_mode: "cluster",
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .
RUN npm install --production

# Node handles SIGTERM correctly
ENTRYPOINT ["node", "dist/server.js"]
```

### Kubernetes

```yaml
kind: Deployment
metadata:
  name: tourist-guide
spec:
  template:
    spec:
      containers:
        - name: app
          image: tourist-guide:latest
          lifecycle:
            preStop:
              exec:
                command: ["sleep", "5"] # Grace period for connections
          terminationGracePeriodSeconds: 30 # Match timeout in server.ts
```

## Testing Error Handlers

### Test Uncaught Exception

```bash
# Add this to a route handler
throw new Error('Test uncaught');
```

### Test Unhandled Rejection

```bash
# Add this to a route handler
Promise.reject(new Error('Test rejection'));
```

### Test SIGINT

```bash
# In terminal
Ctrl+C
```

### Test SIGTERM

```bash
# In another terminal
kill -TERM <PID>
```

## Monitoring & Logging

For production, integrate with:

- **Error Tracking**: Sentry, Rollbar, or Bugsnag
- **Log Aggregation**: ELK Stack, Datadog, or Splunk
- **Application Monitoring**: New Relic or Datadog APM

### Example Sentry Integration

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

process.on("uncaughtException", (error: Error) => {
  Sentry.captureException(error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason: any) => {
  Sentry.captureException(reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});
```

## Best Practices Implemented

✅ **Graceful Shutdown** - Closes connections cleanly  
✅ **Error Logging** - Detailed error information with timestamps  
✅ **Signal Handling** - Responds to OS signals properly  
✅ **Timeout Protection** - Force exit after timeout period  
✅ **Database Safety** - Verifies and closes DB connections  
✅ **Port Conflict Detection** - Clear error for in-use ports  
✅ **Environment Info** - Shows startup environment and URL  
✅ **Active Connections Tracking** - Monitors connection lifecycle  
✅ **Export for Testing** - Can be imported and tested

## Common Issues & Solutions

### Issue: Server hangs on shutdown

**Solution**: Ensure all async operations have timeouts and proper error handling

### Issue: Database connections not closing

**Solution**: Check that `prisma.$disconnect()` is called in shutdown handler

### Issue: Port already in use

**Solution**: Either change PORT or kill the process using that port

### Issue: SIGTERM not triggering graceful shutdown

**Solution**: Ensure `process.on('SIGTERM')` is registered before anything else

## See Also

- [Global Error Handler](../middlewares/globalErrorHandler.ts)
- [AppError Class](../errors/AppError.ts)
- [CatchAsync Utility](../utils/catchAsync.ts)
