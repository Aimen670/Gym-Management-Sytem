const sql = require('mssql');
require('dotenv').config();

// Database configuration
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Use encryption
        trustServerCertificate: true // For local development
    }
};

// Connect to database
async function connectToDatabase() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to SQL Server database');
    } catch (err) {
        console.error('Database connection failed:', err);
    }
}

module.exports = {
    connectToDatabase,
    sql,
    config: dbConfig
};