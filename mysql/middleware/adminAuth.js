// middleware/adminAuth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tripconnect-secret-key-2024';

const adminAuth = async(req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // For development - allow requests without token
        // WARNING: Set ALLOW_DEV_ACCESS=false in production!
        const allowDevAccess = process.env.ALLOW_DEV_ACCESS !== 'false';

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            if (allowDevAccess) {
                console.log('⚠️ No admin token provided - allowing for development');
                req.admin = {
                    id: 'dev_admin',
                    email: 'dev@admin.com',
                    role: 'admin'
                };
                return next();
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET);

            // Check if user is admin (you can customize this based on your user table)
            // For now, we'll assume any valid token is admin in development
            req.admin = {
                id: decoded.userId || decoded.user_id,
                email: decoded.email,
                role: decoded.role || 'admin'
            };

            next();
        } catch (jwtError) {
            if (allowDevAccess) {
                console.log('⚠️ Invalid admin token - allowing for development');
                req.admin = {
                    id: 'dev_admin',
                    email: 'dev@admin.com',
                    role: 'admin'
                };
                next();
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
            }
        }

    } catch (error) {
        console.error('Admin auth error:', error);

        const allowDevAccess = process.env.ALLOW_DEV_ACCESS !== 'false';

        if (allowDevAccess) {
            req.admin = {
                id: 'dev_admin',
                email: 'dev@admin.com',
                role: 'admin'
            };
            next();
        } else {
            res.status(500).json({
                success: false,
                message: 'Authentication error'
            });
        }
    }
};

export default adminAuth;