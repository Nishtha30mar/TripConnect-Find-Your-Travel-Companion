// routes/admin/users.js
import express from 'express';
import mysql from "mysql2/promise";
// import adminAuth from '../../middleware/adminAuth.js'; // Commented out for now

const router = express.Router();

// Create database connection directly in this file
let db;
try {
    db = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "admins",
        database: "tripconnect_db",
    });
    console.log("✅ Admin DB Connected Successfully");
} catch (error) {
    console.error("❌ Admin DB Connection Failed:", error.message);
}

// Apply adminAuth middleware to all routes - COMMENTED OUT FOR TESTING
// router.use(adminAuth);

// =====================================================
// GET ALL USERS - FIXED (created_at removed)
// =====================================================
router.get('/', async(req, res) => {
    try {
        console.log('Fetching all users from database...');

        if (!db) {
            db = await mysql.createConnection({
                host: "localhost",
                user: "root",
                password: "admins",
                database: "tripconnect_db",
            });
        }

        // ✅ FIXED: created_at hata diya, ORDER BY name se kar diya
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
            ORDER BY name ASC
        `);

        console.log(`✅ Found ${users.length} users`);

        res.json({
            success: true,
            users: users,
            count: users.length
        });

    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
});

// =====================================================
// GET SINGLE USER - FIXED (created_at removed)
// =====================================================
router.get('/:id', async(req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not available'
            });
        }

        // ✅ FIXED: created_at hata diya
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
            WHERE user_id = ?
        `, [req.params.id]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message
        });
    }
});

// =====================================================
// UPDATE USER - FIXED
// =====================================================
router.put('/:id', async(req, res) => {
    const {
        name,
        email,
        phone_number,
        dob,
        gender,
        location,
        bio,
        status
    } = req.body;
    const userId = req.params.id;

    if (!name || !email) {
        return res.status(400).json({
            success: false,
            message: 'Name and email are required'
        });
    }

    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not available'
            });
        }

        const [existing] = await db.query(
            'SELECT user_id FROM users WHERE user_id = ?', [userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const [emailCheck] = await db.query(
            'SELECT user_id FROM users WHERE email = ? AND user_id != ?', [email, userId]
        );

        if (emailCheck.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use by another user'
            });
        }

        await db.query(`
            UPDATE users 
            SET 
                name = ?,
                email = ?,
                phone_number = ?,
                dob = ?,
                gender = ?,
                location = ?,
                bio = ?,
                status = ?
            WHERE user_id = ?
        `, [
            name,
            email,
            phone_number || null,
            dob || null,
            gender || null,
            location || null,
            bio || null,
            status || 'active',
            userId
        ]);

        const [updatedUser] = await db.query(`
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
            WHERE user_id = ?
        `, [userId]);

        res.json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser[0]
        });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

// =====================================================
// UPDATE USER STATUS ONLY
// =====================================================
router.put('/:id/status', async(req, res) => {
    const { status } = req.body;
    const userId = req.params.id;

    if (!status || !['active', 'suspended', 'pending'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status value'
        });
    }

    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not available'
            });
        }

        const [existing] = await db.query(
            'SELECT user_id FROM users WHERE user_id = ?', [userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await db.query(
            'UPDATE users SET status = ? WHERE user_id = ?', [status, userId]
        );

        res.json({
            success: true,
            message: `User status updated to ${status}`
        });

    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: error.message
        });
    }
});

// =====================================================
// DELETE USER
// =====================================================
router.delete('/:id', async(req, res) => {
    const userId = req.params.id;

    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not available'
            });
        }

        const [existing] = await db.query(
            'SELECT user_id FROM users WHERE user_id = ?', [userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await db.query('DELETE FROM users WHERE user_id = ?', [userId]);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
});

// =====================================================
// GET USER STATISTICS
// =====================================================
router.get('/stats/summary', async(req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not available'
            });
        }

        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
            FROM users
        `);

        res.json({
            success: true,
            stats: stats[0]
        });

    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user statistics',
            error: error.message
        });
    }
});

// =====================================================
// SEARCH USERS
// =====================================================
router.get('/search/query', async(req, res) => {
    try {
        const { q, status } = req.query;

        if (!db) {
            return res.status(500).json({
                success: false,
                message: 'Database connection not available'
            });
        }

        let query = `
            SELECT 
                user_id,
                name,
                email,
                phone_number,
                gender,
                location,
                status
            FROM users 
            WHERE 1=1
        `;
        let params = [];

        if (q) {
            query += ' AND (name LIKE ? OR email LIKE ? OR phone_number LIKE ? OR user_id LIKE ?)';
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (status && status !== 'all') {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY name ASC';

        const [users] = await db.query(query, params);

        res.json({
            success: true,
            users: users,
            count: users.length
        });

    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search users',
            error: error.message
        });
    }
});

export default router;