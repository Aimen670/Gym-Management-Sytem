const express = require('express');
const app = express();
const cors = require("cors");
require('dotenv').config();
const { connectToDatabase } = require('./db');
const dataRoutes = require('./routes/dataRoutes');
const authRoutes = require('./routes/authRoutes');

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // Add JSON parsing middleware

// Routes
app.use('/api', dataRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Hello from the backend!');
});

app.get('/try', (req, res) => {
    res.send('Aimen Is Best!!');
});

app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    await connectToDatabase();
});