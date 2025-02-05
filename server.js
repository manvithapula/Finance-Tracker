const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001; // Changed to a more common development port

// Middleware for logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Database Connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', // Ensure this matches your MySQL username
    password: 'manvitha@2004', // Your MySQL password
    database: 'finance_tracker',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files with explicit path
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (path.extname(filePath) === '.html') {
            res.setHeader('Content-Type', 'text/html');
        }
    }
}));

// API Routes
app.get('/api/transactions', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

app.post('/api/transactions', async (req, res) => {
    const { type, amount, category, date, description } = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO transactions (type, amount, category, date, description) VALUES (?, ?, ?, ?, ?)',
            [type, amount, category, date, description]
        );

        const newTransaction = {
            id: result.insertId,
            type,
            amount,
            category,
            date,
            description
        };

        res.status(201).json(newTransaction);
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});

// Catch-all route to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create transactions table if not exists
async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();
        await connection.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type ENUM('income', 'expense') NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                category VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                description TEXT
            )
        `);
        connection.release();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Start server
app.listen(PORT, async () => {
    await initializeDatabase();
    console.log(`Server running on http://localhost:${PORT}`);
});