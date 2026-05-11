import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";
import { fileURLToPath } from "url";

// Server instance reference for graceful shutdown
let server: any = null;

/**
 * Gracefully shutdown the server
 * Closes database connections and HTTP server
 */
const gracefulShutdown = async (signal: string) => {
  console.log(`\n[${signal}] Graceful shutdown initiated...`);

  if (server) {
    server.close(async () => {
      console.log(`[${signal}] HTTP server closed`);

      try {
        // Close Prisma database connection
        await prisma.$disconnect();
        console.log(`[${signal}] Database connection closed`);
      } catch (err) {
        console.error(`[${signal}] Error closing database connection:`, err);
        process.exit(1);
      }

      console.log(`[${signal}] Graceful shutdown completed`);
      process.exit(0);
    });

    // Force shutdown after 30 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error(`[${signal}] Graceful shutdown timeout exceeded. Force exiting...`);
      process.exit(1);
    }, 30000);
  } else {
    // Server not started yet, just disconnect database
    try {
      await prisma.$disconnect();
    } catch (err) {
      console.error(`[${signal}] Error closing database connection:`, err);
    }
    process.exit(0);
  }
};

/**
 * Handle uncaught exceptions
 * These are errors that occur outside of async/await or promises
 */
process.on("uncaughtException", (error: Error) => {
  console.error("❌ [UNCAUGHT EXCEPTION]", {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  // Log to external service (e.g., Sentry, DataDog)
  // await logToExternalService(error);

  // Graceful shutdown after uncaught exception
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

/**
 * Handle unhandled promise rejections
 * Promises that reject without a .catch() handler
 */
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("❌ [UNHANDLED REJECTION]", {
    promise,
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : "No stack trace",
    timestamp: new Date().toISOString(),
  });

  // Log to external service (e.g., Sentry, DataDog)
  // await logToExternalService({ reason, promise });

  // Graceful shutdown after unhandled rejection
  gracefulShutdown("UNHANDLED_REJECTION");
});

/**
 * Handle SIGINT (Ctrl+C)
 * Typically triggered by user interruption
 */
process.on("SIGINT", () => {
  gracefulShutdown("SIGINT");
});

/**
 * Handle SIGTERM
 * Typically sent by process managers (PM2, Docker, Kubernetes)
 */
process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM");
});

/**
 * Start the server
 */
async function startServer() {
  try {
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection verified");

    // Start HTTP server
    server = app.listen(config.port, () => {
      console.log(`✅ Server started on port ${config.port} (${process.env.NODE_ENV || "development"} mode)`);
      console.log(`📍 URL: http://localhost:${config.port}`);
    });

    // Track active connections for graceful shutdown
    const activeConnections = new Set();

    server.on("connection", (conn: any) => {
      activeConnections.add(conn);
      conn.on("close", () => {
        activeConnections.delete(conn);
      });
    });

    // Handle server errors
    server.on("error", (error: any) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${config.port} is already in use. Please use a different port.`);
        process.exit(1);
      } else {
        console.error("❌ Server error:", error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    console.error(error instanceof Error ? error.stack : String(error));

    try {
      await prisma.$disconnect();
    } catch (dbError) {
      console.error("❌ Error disconnecting from database:", dbError);
    }

    process.exit(1);
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  startServer();
}

export default startServer;
