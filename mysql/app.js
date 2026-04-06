// app.js
import mysql from "mysql2/promise";

// MySQL connection
let db;
try {
    db = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "admins", // Using admins password
        database: "tripconnect_db",
    });

    console.log("✅ MySQL Connected Successfully");

} catch (error) {
    console.error("❌ MySQL Connection Failed:", error.message);
}

// Export default db
export default db;