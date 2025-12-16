const mysql = require('mysql2/promise');

async function checkAndCreateDatabase() {
    try {
        console.log('[INFO] Connecting to MySQL...');
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });
        
        console.log('[OK] Connected to MySQL');
        
        // Check if database exists
        const [dbs] = await conn.execute("SHOW DATABASES LIKE 'pledgehub_db'");
        
        if (dbs.length > 0) {
            console.log('[OK] Database "pledgehub_db" EXISTS');
            
            // Check tables
            await conn.execute('USE pledgehub_db');
            const [tables] = await conn.execute('SHOW TABLES');
            
            if (tables.length > 0) {
                console.log('[OK] Database has', tables.length, 'tables:');
                tables.forEach(t => console.log('  -', Object.values(t)[0]));
            } else {
                console.log('[WARN] Database exists but has NO TABLES');
                console.log('[INFO] Run: node backend/scripts/complete-migration.js');
            }
        } else {
            console.log('[WARN] Database "pledgehub_db" does NOT exist');
            console.log('[INFO] Creating database...');
            
            await conn.execute('CREATE DATABASE pledgehub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
            console.log('[OK] Database "pledgehub_db" CREATED successfully!');
            console.log('[INFO] Next: Run init-database.sql or complete-migration.js');
        }
        
        await conn.end();
        console.log('[OK] Check complete');
        
    } catch (error) {
        console.error('[ERROR]', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('[INFO] Check MySQL credentials in backend/.env:');
            console.log('       DB_USER=root');
            console.log('       DB_PASS=your_password');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('[INFO] MySQL server is not running');
            console.log('[INFO] Start it with: net start MySQL');
        }
        
        process.exit(1);
    }
}

checkAndCreateDatabase();
