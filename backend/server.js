const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// =======================
// Middleware
// =======================
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// =======================
// MongoDB Connection
// =======================
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 60000,
}).then(() => {
  console.log('✅ Connected to MongoDB Atlas');
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
});

// =======================
// Routes
// =======================
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

// API routes FIRST
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Test route (helps debugging)
app.get('/api', (req, res) => {
  res.json({ message: "API is running" });
});

// =======================
// Serve Frontend
// =======================
const frontendPath = path.join(__dirname, '..', 'frontend');

app.use(express.static(frontendPath));

// =======================
// Fallback route (VERY IMPORTANT)
// =======================
app.get('*', (req, res) => {
  // ❌ DO NOT let frontend override API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }

  res.sendFile(path.join(frontendPath, 'index.html'));
});

// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});