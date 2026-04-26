const path = require('path');
const sql = require('mssql');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

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

let pool;

// Connect to database
async function connectToDatabase() {
    try {
        if (pool) {
            return pool;
        }
        pool = await sql.connect(dbConfig);
        console.log('Connected to SQL Server database');
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err;
    }
}

function getPool() {
    if (!pool) {
        throw new Error('Database not connected');
    }
    return pool;
}

module.exports = {
    connectToDatabase,
    getPool,
    sql,
    config: dbConfig
};