const path = require('path');
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const cors = require("cors");
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { connectToDatabase } = require('./db');
const { ensureMinimumSchema } = require('./utils/ensureSchema');
const { initializeSocketServer } = require('./socketServer');
const dataRoutes = require('./routes/dataRoutes');// import dataRoutes to handle data-related API endpoints
const authRoutes = require('./routes/authRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const trainingBookingRoutes = require('./routes/trainingBookingRoutes');
const classRoutes = require('./routes/classRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const fitnessGoalRoutes = require('./routes/fitnessGoalRoutes');
const phoneRemoteRoutes = require('./routes/phoneRemoteRoutes');

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // Add JSON parsing middleware

// Routes
app.use('/api', dataRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', trainerRoutes);
app.use('/api', adminRoutes);
app.use('/api', trainingBookingRoutes);
app.use('/api', classRoutes);
app.use('/api', enrollmentRoutes);
app.use('/api', fitnessGoalRoutes);
app.use('/api', phoneRemoteRoutes);

app.get('/', (req, res) => {
    res.send('Hello from the backend!');
});

app.get('/try', (req, res) => {
    res.send('Aimen Is Best!!');
});

const startServer = async () => {
    try {
        await connectToDatabase();
        await ensureMinimumSchema();
        
        // Initialize Socket.IO server
        initializeSocketServer(server);
        
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on http://localhost:${PORT}`);
            console.log(`Server is accessible on network at http://192.168.100.220:${PORT}`);
        });
    } catch (err) {
        console.error('Server start failed:', err.message);
        process.exit(1);
    }
};

startServer();