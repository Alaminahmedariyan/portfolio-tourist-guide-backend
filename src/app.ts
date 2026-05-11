import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { globalErrorHandler } from './middlewares/globalErrorHandler';
import { notFoundMiddleware } from './middlewares/notFound';

const app: Application = express();

// parsers
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // access control allow origin
app.use(cookieParser()); // Parse cookies

// application routes
// app.use('/api/v1', router);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Apollo Gears World!');
});

// Global error handling middleware

app.use(globalErrorHandler);
// Not found middleware
app.use(notFoundMiddleware);

export default app;
