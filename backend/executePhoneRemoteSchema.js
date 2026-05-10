const fs = require('fs');
const path = require('path');
const { connectToDatabase, sql } = require('./db');

async function executeSchema() {
    try {
        console.log('Connecting to database...');
        const pool = await connectToDatabase();
        
        console.log('Reading phoneRemoteSchema.sql...');
        const schemaPath = path.join(__dirname, 'phoneRemoteSchema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Executing schema...');
        
        // Split the SQL file by GO statements and execute each batch
        const batches = schemaSQL.split(/\r?\nGO\r?\n/);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i].trim();
            if (batch) {
                try {
                    await pool.request().batch(batch);
                    console.log(`Executed batch ${i + 1}/${batches.length}`);
                } catch (err) {
                    console.error(`Error in batch ${i + 1}:`, err.message);
                    // Continue with next batch
                }
            }
        }
        
        console.log('Schema execution completed successfully!');
        
    } catch (error) {
        console.error('Error executing schema:', error);
    } finally {
        process.exit(0);
    }
}

executeSchema();
