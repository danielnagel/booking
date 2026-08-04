import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';
import bookingsRouter from './routes/bookings.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/bookings', bookingsRouter);

export default app;
