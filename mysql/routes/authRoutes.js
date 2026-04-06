import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'tripconnect-secret-key-2024';

// =====================================================
// ALTERNATIVE USER ENDPOINTS (for admin compatibility)
// =====================================================

// GET all users - Callback style
router.get('/users', (req, res) => {
    db.query(`
        SELECT 
            user_id,
            name,
            email,
            phone_number,
            DATE_FORMAT(dob, '%Y-%m-%d') as dob,
            gender,
            location,
            bio,
            status
        FROM users 
        ORDER BY name ASC
    `, (err, users) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch users'
            });
        }
        res.json(users);
    });
});

// GET single user - Callback style
router.get('/users/:userId', (req, res) => {
    const { userId } = req.params;

    db.query(`
        SELECT 
            user_id,
            name,
            email,
            phone_number,
            DATE_FORMAT(dob, '%Y-%m-%d') as dob,
            gender,
            location,
            bio,
            status
        FROM users 
        WHERE user_id = ?
    `, [userId], (err, users) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch user'
            });
        }

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json(users[0]);
    });
});

// UPDATE user - Callback style (FIXED to handle bio updates)
router.put('/users/:userId', (req, res) => {
    const { userId } = req.params;
    const {
        name,
        email,
        phone_number,
        dob,
        gender,
        location,
        bio,
        status,
        avatar
    } = req.body;

    // Get token from header for authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    // Verify token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Check if user is updating their own profile
        if (decoded.userId != userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update this profile'
            });
        }

        // First check if user exists
        db.query('SELECT user_id FROM users WHERE user_id = ?', [userId], (err, existing) => {
            if (err) {
                console.error('Error checking user:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Database error'
                });
            }

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Build dynamic update query for fields that are provided
            const updateFields = [];
            const values = [];

            if (name !== undefined) {
                updateFields.push('name = ?');
                values.push(name);
            }
            if (email !== undefined) {
                updateFields.push('email = ?');
                values.push(email);
            }
            if (phone_number !== undefined) {
                updateFields.push('phone_number = ?');
                values.push(phone_number);
            }
            if (dob !== undefined) {
                updateFields.push('dob = ?');
                values.push(dob);
            }
            if (gender !== undefined) {
                updateFields.push('gender = ?');
                values.push(gender);
            }
            if (location !== undefined) {
                updateFields.push('location = ?');
                values.push(location);
            }
            if (bio !== undefined) {
                updateFields.push('bio = ?');
                values.push(bio);
            }
            if (status !== undefined) {
                updateFields.push('status = ?');
                values.push(status);
            }
            if (avatar !== undefined) {
                updateFields.push('avatar = ?');
                values.push(avatar);
            }

            // If no fields to update, return current user data
            if (updateFields.length === 0) {
                db.query(`
                    SELECT 
                        user_id, 
                        name, 
                        email, 
                        phone_number, 
                        DATE_FORMAT(dob, '%Y-%m-%d') as dob, 
                        gender, 
                        location, 
                        bio, 
                        status,
                        avatar
                    FROM users 
                    WHERE user_id = ?
                `, [userId], (err, userResult) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            error: 'Failed to fetch user'
                        });
                    }
                    return res.json({
                        success: true,
                        message: 'No changes made',
                        user: userResult[0]
                    });
                });
                return;
            }

            // Perform update
            values.push(userId);
            const query = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`;

            db.query(query, values, (err, updateResult) => {
                if (err) {
                    console.error('Error updating user:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to update user: ' + err.message
                    });
                }

                // Fetch the updated user data
                db.query(`
                    SELECT 
                        user_id, 
                        name, 
                        email, 
                        phone_number, 
                        DATE_FORMAT(dob, '%Y-%m-%d') as dob, 
                        gender, 
                        location, 
                        bio, 
                        status,
                        avatar
                    FROM users 
                    WHERE user_id = ?
                `, [userId], (err, userResult) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            error: 'User updated but failed to fetch updated data'
                        });
                    }

                    res.json({
                        success: true,
                        message: 'User updated successfully',
                        user: userResult[0]
                    });
                });
            });
        });
    });
});

// DELETE user - Callback style
router.delete('/users/:userId', (req, res) => {
    const { userId } = req.params;

    db.query('SELECT user_id FROM users WHERE user_id = ?', [userId], (err, existing) => {
        if (err) {
            console.error('Error checking user:', err);
            return res.status(500).json({
                success: false,
                error: 'Database error'
            });
        }

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        db.query('DELETE FROM users WHERE user_id = ?', [userId], (err, result) => {
            if (err) {
                console.error('Error deleting user:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to delete user'
                });
            }

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        });
    });
});

// =====================================================
// AUTH ENDPOINTS
// =====================================================

// SIGNUP - Callback style
router.post('/signup', (req, res) => {
    const {
        user_id,
        name,
        email,
        phone_number,
        password,
        dob,
        gender,
        location
    } = req.body;

    // Input validation
    if (!user_id || !name || !email || !phone_number || !password) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    // 1. Check if user exists
    db.query('SELECT * FROM users WHERE email = ? OR user_id = ?', [email, user_id], async (err, result) => {
        if (err) {
            console.error('Signup check error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (result.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Insert user
        db.query(`
            INSERT INTO users
            (user_id, name, email, phone_number, password, dob, gender, location, status, bio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
        `, [
            user_id,
            name,
            email,
            phone_number,
            hashedPassword,
            dob || null,
            gender || null,
            location || null,
            null
        ], (err, insertResult) => {
            if (err) {
                console.error('Insert error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            // 4. Get the created user
            db.query(`
                SELECT user_id, name, email, phone_number, 
                       DATE_FORMAT(dob, '%Y-%m-%d') as dob, 
                       gender, location, bio, status
                FROM users 
                WHERE user_id = ?
            `, [user_id], (err, userResult) => {
                if (err) {
                    console.error('Error fetching new user:', err);
                    return res.status(201).json({
                        success: true,
                        message: 'Signup successful but error fetching user'
                    });
                }

                const user = userResult[0];

                // 5. Create token
                const token = jwt.sign(
                    { userId: user.user_id, email: user.email },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );

                // 6. Send response
                res.status(201).json({
                    success: true,
                    message: 'Signup successful',
                    token: token,
                    user: user
                });
            });
        });
    });
});

// LOGIN - Callback style
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, users) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Create token
        const token = jwt.sign(
            { userId: user.user_id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: userWithoutPassword
        });
    });
});

// GET USER PROFILE - Callback style (FIXED to include bio)
router.get('/profile', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log('Token verification failed:', err);
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        console.log('Token decoded:', decoded);

        // ✅ ADDED bio to SELECT query
        db.query(`
            SELECT user_id, name, email, phone_number, 
                   DATE_FORMAT(dob, '%Y-%m-%d') as dob, 
                   gender, location, bio, status
            FROM users 
            WHERE user_id = ?
        `, [decoded.userId], (err, result) => {
            if (err) {
                console.error('Profile DB error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = result[0];
            console.log('User found:', user);

            res.json({
                success: true,
                message: 'Profile retrieved',
                user: user
            });
        });
    });
});

// GET USER BY ID (for fetching match details) - Callback style
router.get('/user/:user_id', (req, res) => {
    const { user_id } = req.params;
    
    db.query(`
        SELECT user_id, name, email, location, 
               DATE_FORMAT(dob, '%Y-%m-%d') as dob, 
               gender, bio, status
        FROM users 
        WHERE user_id = ?
    `, [user_id], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user: results[0]
        });
    });
});

export default router;