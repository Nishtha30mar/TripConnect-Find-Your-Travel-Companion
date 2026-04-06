// =====================================================
// IMPORTS
// =====================================================
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

import authRoutes from './routes/authRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import preferenceRoutes from './routes/preferenceRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import adminUsersRoutes from './routes/admin/users.js';
import adminPackageRoutes from './routes/admin/packageRoutes.js';
import adminGroupRoutes from './routes/admin/groupRoutes.js';
import adminSelfGroupRoutes from './routes/admin/selfGroupRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

// =====================================================
// INITIALIZE APP
// =====================================================
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// =====================================================
// DATABASE POOL
// =====================================================
export const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "admins", // Using first server's password
    database: "tripconnect_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB connection at startup
(async() => {
    try {
        const connection = await db.getConnection();
        console.log("✅ Database connected successfully");
        connection.release();
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
    }
})();

// =====================================================
// TEST ROUTES
// =====================================================
app.get('/api/test', (req, res) => {
    console.log('✅ Test route hit');
    res.json({
        success: true,
        message: 'Server is working!'
    });
});

// =====================================================
// DIRECT USERS ENDPOINT - FIXED (created_at removed)
// =====================================================
app.get('/api/direct-users', async(req, res) => {
    console.log('🔍 Direct DB test called');

    try {
        const [users] = await db.query(`
            SELECT 
                user_id,
                name,
                email,
                phone_number,
                DATE_FORMAT(dob, '%Y-%m-%d') as dob,
                gender,
                bio,
                location,
                status
            FROM users
        `);

        res.json({
            success: true,
            data: users,
            count: users.length
        });

    } catch (error) {
        console.error('❌ DB Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// =====================================================
// MAIN ROUTES
// =====================================================
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/reviews', reviewRoutes);

// =====================================================
// ADMIN ROUTES
// =====================================================
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/packages', adminPackageRoutes);
app.use('/api/admin/groups', adminGroupRoutes);
app.use('/api/admin/ai-groups', adminGroupRoutes);
app.use('/api/admin/self-groups', adminSelfGroupRoutes);

// =====================================================
// GROUP ROUTES - MOVED HERE BEFORE 404 HANDLER
// =====================================================
app.use('/api/groups', groupRoutes);

// =====================================================
// ROOT ROUTE
// =====================================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'TripConnect API Server',
        routes: {
            test: '/api/test',
            directUsers: '/api/direct-users',
            auth: '/api/auth',
            packages: '/api/packages',
            preferences: '/api/preferences',
            members: '/api/members',
            groups: '/api/groups',
            reviews: '/api/reviews',
            adminUsers: '/api/admin/users',
            adminPackages: '/api/admin/packages',
            adminGroups: '/api/admin/groups',
            adminAIGroups: '/api/admin/ai-groups',
            adminSelfGroups: '/api/admin/self-groups'
        }
    });
});

// =====================================================
// 404 HANDLER - MUST BE LAST
// =====================================================
app.use((req, res) => {
    console.log(`❌ 404 - Route not found: ${req.url}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.url} not found`
    });
});

// =====================================================
// START SERVER
// =====================================================
const PORT = 5000;

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log(`✅ Test route: http://localhost:${PORT}/api/test`);
    console.log(`✅ Direct users: http://localhost:${PORT}/api/direct-users`);
    console.log(`✅ Auth routes: http://localhost:${PORT}/api/auth`);
    console.log(`✅ Package routes: http://localhost:${PORT}/api/packages`);
    console.log(`✅ Preference routes: http://localhost:${PORT}/api/preferences`);
    console.log(`✅ Member routes: http://localhost:${PORT}/api/members`);
    console.log(`✅ Group routes: http://localhost:${PORT}/api/groups`);
    console.log(`✅ Review routes: http://localhost:${PORT}/api/reviews`);
    console.log(`✅ Admin users: http://localhost:${PORT}/api/admin/users`);
    console.log(`✅ Admin packages: http://localhost:${PORT}/api/admin/packages`);
    console.log(`✅ Admin groups: http://localhost:${PORT}/api/admin/groups`);
    console.log(`✅ Admin AI groups: http://localhost:${PORT}/api/admin/ai-groups`);
    console.log(`✅ Admin Self Groups: http://localhost:${PORT}/api/admin/self-groups`);
    console.log('='.repeat(50) + '\n');
});