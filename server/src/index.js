require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./utils/logger');
const attackLogger = require('./middleware/attackLogger');
const attackDetector = require('./middleware/attackDetector');

// Import routes
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const couponRoutes = require('./routes/coupons');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf?.length ? buf.toString('utf8') : '';
  }
}));
app.use(express.urlencoded({
  extended: true,
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf?.length ? buf.toString('utf8') : '';
  }
}));

// Attack logging and detection middleware (applied to all routes)
app.use(attackLogger);
app.use(attackDetector);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'honeyglow-backend' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/honeyglow')
  .then(() => {
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`HoneyGlow Trap Backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

module.exports = app;
