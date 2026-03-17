import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import visitRoutes from './routes/visitRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import remarkRoutes from './routes/remarkRoutes.js';
import nlpResultRoutes from './routes/nlpResultRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import alertRoutes from './routes/alertRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Dispensary backend is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/remarks', remarkRoutes);
app.use('/api/nlp-results', nlpResultRoutes);
app.use('/api/alerts', alertRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});