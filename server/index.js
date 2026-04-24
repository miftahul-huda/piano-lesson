const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const User = require('./models/User');
const Session = require('./models/Session');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const remoteRoutes = require('./routes/remote');

const app = express();

// SECURITY & LOGGING
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  if (!req.url.includes('/api/remote/poll')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

const { swaggerUi, specs } = require('./swagger');

// ROUTES
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/remote', remoteRoutes);

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5001;

// ROBUST STARTUP
const start = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected.');
    
    await sequelize.sync({ alter: true });
    console.log('Database synced.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is staying alive on port ${PORT}`);
      console.log('Keep this terminal open!');
      
      // Force the process to stay alive
      setInterval(() => {
        // This keeps the event loop active even if something else tries to close it
        if (global.gc) global.gc(); 
      }, 10000);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// DEBUG PROCESS EXIT
process.on('exit', (code) => console.log(`------- SERVER EXITING WITH CODE: ${code} -------`));
process.on('uncaughtException', (err) => console.error('CRITICAL:', err));
process.on('unhandledRejection', (err) => console.error('REJECTION:', err));

start();
