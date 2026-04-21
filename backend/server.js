const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection - CORRECTED
const mongoURI = process.env.MONGO_URI || 'mongodb://cloudspace:Cloudspace123@cloudspace-shard-00-00.btlbrhh.mongodb.net:27017,cloudspace-shard-00-01.btlbrhh.mongodb.net:27017,cloudspace-shard-00-02.btlbrhh.mongodb.net:27017/cloudspace?retryWrites=true&w=majority&authSource=admin';

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
  console.error('💡 Tip: Make sure your IP is whitelisted and firewall allows port 27017');
});

// Routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'), (err) => {
    if (err) res.status(500).send(err);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});