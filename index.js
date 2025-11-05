import express from 'express';
import cors from 'cors';

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'https://awezomevouchers.vercel.app',
    'https://awezomevouchers-frontend.vercel.app',
    'https://awazonnewachers-frontend-4dac7j9f1-awazonres-projects.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Awezome Vouchers Backend is running ✅');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is working',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
