import express from 'express';
import db from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tripconnect-secret-key-2024';

// Middleware to verify token
const authenticateToken = (req, res, next) => {
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
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        req.userId = decoded.userId;
        next();
    });
};

// ============================================
// SUBMIT A REVIEW
// POST /api/reviews
// ============================================
router.post('/', authenticateToken, async (req, res) => {
    const { user_id, group_id, rating, review_text } = req.body;
    
    console.log('📝 Submitting review:', { user_id, group_id, rating });
    
    // Validate input
    if (!user_id || !group_id || !rating || !review_text) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: user_id, group_id, rating, review_text are required'
        });
    }
    
    if (rating < 1 || rating > 5) {
        return res.status(400).json({
            success: false,
            message: 'Rating must be between 1 and 5'
        });
    }
    
    // Verify the authenticated user matches the user_id
    if (user_id !== req.userId) {
        return res.status(403).json({
            success: false,
            message: 'You can only submit reviews for yourself'
        });
    }
    
    try {
        // Check if user is part of this group
        const [memberCheck] = await db.promise().query(
            'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
            [group_id, user_id]
        );
        
        if (memberCheck.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this trip'
            });
        }
        
        // Check if trip is completed (end date has passed)
        const [tripCheck] = await db.promise().query(
            'SELECT * FROM travel_groups WHERE group_id = ? AND end_date < CURDATE()',
            [group_id]
        );
        
        if (tripCheck.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'You can only review completed trips'
            });
        }
        
        // Check if user has already reviewed this trip
        const [existingReview] = await db.promise().query(
            'SELECT * FROM trip_reviews WHERE user_id = ? AND group_id = ?',
            [user_id, group_id]
        );
        
        if (existingReview.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this trip'
            });
        }
        
        // Insert review
        const [result] = await db.promise().query(
            `INSERT INTO trip_reviews (user_id, group_id, rating, review_text, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [user_id, group_id, rating, review_text]
        );
        
        // Update average rating for the group
        await db.promise().query(
            `UPDATE travel_groups 
             SET average_match_score = (
                 SELECT AVG(rating) 
                 FROM trip_reviews 
                 WHERE group_id = ?
             )
             WHERE group_id = ?`,
            [group_id, group_id]
        );
        
        console.log(`✅ Review submitted successfully! Review ID: ${result.insertId}`);
        
        res.json({
            success: true,
            message: 'Review submitted successfully',
            review_id: result.insertId,
            data: {
                review_id: result.insertId,
                rating: rating,
                review_text: review_text
            }
        });
        
    } catch (error) {
        console.error('❌ Error submitting review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit review',
            error: error.message
        });
    }
});

// ============================================
// GET REVIEWS FOR A SPECIFIC GROUP
// GET /api/reviews/group/:group_id
// ============================================
router.get('/group/:group_id', authenticateToken, async (req, res) => {
    const { group_id } = req.params;
    
    try {
        // Check if user is a member of the group
        const [memberCheck] = await db.promise().query(
            'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
            [group_id, req.userId]
        );
        
        if (memberCheck.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }
        
        const [reviews] = await db.promise().query(
            `SELECT r.*, u.name as user_name, u.bio as user_bio
             FROM trip_reviews r
             JOIN users u ON r.user_id = u.user_id
             WHERE r.group_id = ?
             ORDER BY r.created_at DESC`,
            [group_id]
        );
        
        // Calculate average rating
        let averageRating = 0;
        if (reviews.length > 0) {
            const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
            averageRating = sum / reviews.length;
        }
        
        res.json({
            success: true,
            reviews: reviews,
            stats: {
                total_reviews: reviews.length,
                average_rating: averageRating.toFixed(1)
            }
        });
        
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
});

// ============================================
// GET REVIEWS BY USER
// GET /api/reviews/user/:user_id
// ============================================
router.get('/user/:user_id', authenticateToken, async (req, res) => {
    const { user_id } = req.params;
    
    // Check if user is requesting their own reviews
    if (user_id !== req.userId) {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized access'
        });
    }
    
    try {
        const [reviews] = await db.promise().query(
            `SELECT r.*, tg.destination as trip_destination, tg.start_date, tg.end_date, tg.status as trip_status
             FROM trip_reviews r
             JOIN travel_groups tg ON r.group_id = tg.group_id
             WHERE r.user_id = ?
             ORDER BY r.created_at DESC`,
            [user_id]
        );
        
        // Format review data
        const formattedReviews = reviews.map(review => ({
            review_id: review.review_id,
            group_id: review.group_id,
            trip_id: review.group_id,
            trip_name: review.trip_destination,
            trip_destination: review.trip_destination,
            rating: review.rating,
            review_text: review.review_text,
            created_at: review.created_at,
            updated_at: review.updated_at,
            trip_status: review.trip_status,
            start_date: review.start_date,
            end_date: review.end_date
        }));
        
        res.json({
            success: true,
            reviews: formattedReviews,
            count: formattedReviews.length
        });
        
    } catch (error) {
        console.error('Error fetching user reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message
        });
    }
});

// ============================================
// UPDATE A REVIEW
// PUT /api/reviews/:review_id
// ============================================
router.put('/:review_id', authenticateToken, async (req, res) => {
    const { review_id } = req.params;
    const { rating, review_text } = req.body;
    
    try {
        // Check if review exists and belongs to user
        const [review] = await db.promise().query(
            'SELECT * FROM trip_reviews WHERE review_id = ? AND user_id = ?',
            [review_id, req.userId]
        );
        
        if (review.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or unauthorized'
            });
        }
        
        // Update review
        await db.promise().query(
            `UPDATE trip_reviews 
             SET rating = ?, review_text = ?, updated_at = NOW()
             WHERE review_id = ?`,
            [rating, review_text, review_id]
        );
        
        // Update group average rating
        await db.promise().query(
            `UPDATE travel_groups 
             SET average_match_score = (
                 SELECT AVG(rating) 
                 FROM trip_reviews 
                 WHERE group_id = ?
             )
             WHERE group_id = ?`,
            [review[0].group_id, review[0].group_id]
        );
        
        res.json({
            success: true,
            message: 'Review updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review',
            error: error.message
        });
    }
});

// ============================================
// DELETE A REVIEW
// DELETE /api/reviews/:review_id
// ============================================
router.delete('/:review_id', authenticateToken, async (req, res) => {
    const { review_id } = req.params;
    
    try {
        // Check if review exists and belongs to user
        const [review] = await db.promise().query(
            'SELECT * FROM trip_reviews WHERE review_id = ? AND user_id = ?',
            [review_id, req.userId]
        );
        
        if (review.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found or unauthorized'
            });
        }
        
        const groupId = review[0].group_id;
        
        // Delete review
        await db.promise().query('DELETE FROM trip_reviews WHERE review_id = ?', [review_id]);
        
        // Update group average rating (if there are remaining reviews)
        const [remainingReviews] = await db.promise().query(
            'SELECT COUNT(*) as count FROM trip_reviews WHERE group_id = ?',
            [groupId]
        );
        
        if (remainingReviews[0].count > 0) {
            await db.promise().query(
                `UPDATE travel_groups 
                 SET average_match_score = (
                     SELECT AVG(rating) 
                     FROM trip_reviews 
                     WHERE group_id = ?
                 )
                 WHERE group_id = ?`,
                [groupId, groupId]
            );
        } else {
            // No reviews left, set average_match_score to NULL
            await db.promise().query(
                'UPDATE travel_groups SET average_match_score = NULL WHERE group_id = ?',
                [groupId]
            );
        }
        
        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
            error: error.message
        });
    }
});

// ============================================
// GET REVIEW STATISTICS FOR A USER
// GET /api/reviews/user/:user_id/stats
// ============================================
router.get('/user/:user_id/stats', authenticateToken, async (req, res) => {
    const { user_id } = req.params;
    
    if (user_id !== req.userId) {
        return res.status(403).json({
            success: false,
            message: 'Unauthorized access'
        });
    }
    
    try {
        const [stats] = await db.promise().query(
            `SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                MAX(rating) as highest_rating,
                MIN(rating) as lowest_rating,
                COUNT(DISTINCT group_id) as unique_trips
             FROM trip_reviews 
             WHERE user_id = ?`,
            [user_id]
        );
        
        // Get rating distribution
        const [distribution] = await db.promise().query(
            `SELECT rating, COUNT(*) as count
             FROM trip_reviews
             WHERE user_id = ?
             GROUP BY rating
             ORDER BY rating DESC`,
            [user_id]
        );
        
        res.json({
            success: true,
            stats: {
                total_reviews: stats[0].total_reviews || 0,
                average_rating: stats[0].average_rating ? parseFloat(stats[0].average_rating).toFixed(1) : 0,
                highest_rating: stats[0].highest_rating || 0,
                lowest_rating: stats[0].lowest_rating || 0,
                unique_trips: stats[0].unique_trips || 0
            },
            distribution: distribution
        });
        
    } catch (error) {
        console.error('Error fetching review stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch review statistics',
            error: error.message
        });
    }
});

export default router;