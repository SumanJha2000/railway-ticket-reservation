const pool = require('./db.js'); // adjust path as needed
require('dotenv').config();
async function testConnection() {
    try {
        // Get a connection from the pool
        const connection = await pool.getConnection();

        // Run a test query
        const [rows] = await connection.query('SELECT 1');

        console.log('MySQL connection successful:', rows);

        // Release connection back to pool
        connection.release();

    } catch (error) {
        console.error('MySQL connection failed:', error.message);
    }
}

testConnection();
