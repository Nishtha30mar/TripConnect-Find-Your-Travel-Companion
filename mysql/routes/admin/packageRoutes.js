// routes/admin/packageRoutes.js
import express from 'express';
import db from '../../db.js';

const router = express.Router();

// =====================================================
// GET ALL PACKAGES (with optional filters)
// =====================================================
router.get('/', (req, res) => {
    const { status, search } = req.query;

    let query = `
        SELECT 
            package_id,
            destination,
            title,
            description,
            price_per_person,
            duration_days,
            min_travellers,
            max_travellers,
            included_features,
            image_url,
            is_active,
            details
        FROM packages
    `;

    const params = [];
    const conditions = [];

    // Add filters if provided
    if (status && status !== 'all') {
        conditions.push('is_active = ?');
        params.push(status === 'active' ? 1 : 0);
    }

    if (search) {
        conditions.push('(title LIKE ? OR destination LIKE ? OR description LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY package_id DESC';

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('❌ Error fetching packages:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.json({
            success: true,
            packages: results,
            count: results.length
        });
    });
});

// =====================================================
// GET SINGLE PACKAGE BY ID
// =====================================================
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT 
            package_id,
            destination,
            title,
            description,
            price_per_person,
            duration_days,
            min_travellers,
            max_travellers,
            included_features,
            image_url,
            is_active,
            details
        FROM packages 
        WHERE package_id = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('❌ Error fetching package:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        res.json({
            success: true,
            package: results[0]
        });
    });
});

// =====================================================
// CREATE NEW PACKAGE
// =====================================================
router.post('/', (req, res) => {
    const {
        title,
        destination,
        description,
        price_per_person,
        duration_days,
        min_travellers,
        max_travellers,
        included_features,
        image_url,
        is_active,
        details
    } = req.body;

    // Validate required fields
    if (!title || !destination || !price_per_person) {
        return res.status(400).json({
            success: false,
            message: 'Title, destination, and price are required'
        });
    }

    const query = `
        INSERT INTO packages (
            title,
            destination,
            description,
            price_per_person,
            duration_days,
            min_travellers,
            max_travellers,
            included_features,
            image_url,
            is_active,
            details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        title,
        destination,
        description || null,
        price_per_person,
        duration_days || null,
        min_travellers || 1,
        max_travellers || 10,
        included_features || null,
        image_url || null,
        is_active !== undefined ? is_active : 1,
        details || null
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('❌ Error creating package:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Package created successfully',
            package_id: result.insertId
        });
    });
});

// =====================================================
// UPDATE PACKAGE
// =====================================================
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const {
        title,
        destination,
        description,
        price_per_person,
        duration_days,
        min_travellers,
        max_travellers,
        included_features,
        image_url,
        is_active,
        details
    } = req.body;

    // Validate required fields
    if (!title || !destination || !price_per_person) {
        return res.status(400).json({
            success: false,
            message: 'Title, destination, and price are required'
        });
    }

    const query = `
        UPDATE packages 
        SET 
            title = ?,
            destination = ?,
            description = ?,
            price_per_person = ?,
            duration_days = ?,
            min_travellers = ?,
            max_travellers = ?,
            included_features = ?,
            image_url = ?,
            is_active = ?,
            details = ?
        WHERE package_id = ?
    `;

    const values = [
        title,
        destination,
        description || null,
        price_per_person,
        duration_days || null,
        min_travellers || 1,
        max_travellers || 10,
        included_features || null,
        image_url || null,
        is_active !== undefined ? is_active : 1,
        details || null,
        id
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('❌ Error updating package:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        res.json({
            success: true,
            message: 'Package updated successfully'
        });
    });
});

// =====================================================
// DELETE PACKAGE
// =====================================================
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM packages WHERE package_id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('❌ Error deleting package:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        res.json({
            success: true,
            message: 'Package deleted successfully'
        });
    });
});

// =====================================================
// TOGGLE PACKAGE STATUS (active/inactive)
// =====================================================
router.patch('/:id/toggle-status', (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    const query = 'UPDATE packages SET is_active = ? WHERE package_id = ?';

    db.query(query, [is_active, id], (err, result) => {
        if (err) {
            console.error('❌ Error toggling package status:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        res.json({
            success: true,
            message: `Package ${is_active ? 'activated' : 'deactivated'} successfully`
        });
    });
});

export default router;