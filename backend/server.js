const path = require('path');
const express = require('express');
const app = express();
const cors = require("cors");
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { connectToDatabase } = require('./db');
const dataRoutes = require('./routes/dataRoutes');// import dataRoutes to handle data-related API endpoints
const authRoutes = require('./routes/authRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const adminRoutes = require('./routes/adminRoutes');

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // Add JSON parsing middleware

// Routes
app.use('/api', dataRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', trainerRoutes);
app.use('/api', adminRoutes);

app.get('/', (req, res) => {
    res.send('Hello from the backend!');
});

app.get('/try', (req, res) => {
    res.send('Aimen Is Best!!');
});

const startServer = async () => {
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Server start failed:', err.message);
        process.exit(1);
    }
};

startServer();