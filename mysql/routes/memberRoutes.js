import express from 'express';
import db from '../db.js';

const router = express.Router();

// ==================================================
// 🚀 SIMPLE SAVE - YE PAKKA KAM KAREGA (from first file)
// ==================================================
router.post('/save', (req, res) => {
    console.log('='.repeat(50));
    console.log('📥 SAVE REQUEST RECEIVED');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const { preference_id, members } = req.body;
    
    // Validation
    if (!preference_id) {
        return res.status(400).json({ 
            success: false, 
            message: 'preference_id is required' 
        });
    }
    
    if (!members || !Array.isArray(members)) {
        return res.status(400).json({ 
            success: false, 
            message: 'members array is required' 
        });
    }
    
    console.log(`📌 Preference ID: ${preference_id}`);
    console.log(`👥 Members: ${members.length}`);
    
    // Check if preference exists
    db.query('SELECT * FROM travel_preferences WHERE preference_id = ?', [preference_id], (err, results) => {
        if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: `Preference ${preference_id} not found` 
            });
        }
        
        console.log(`✅ Preference exists, inserting members...`);
        
        // 🔥 DIRECT INSERT - NO CHECKS
        let inserted = 0;
        let errors = [];
        let completed = 0;
        
        if (members.length === 0) {
            return res.json({ 
                success: true, 
                message: 'No members to insert' 
            });
        }
        
        members.forEach((member) => {
            const name = member.name || 'Unknown';
            const age = member.age || 0;
            const relationship = member.relationship || 'Self';
            
            console.log(`📝 Inserting: ${name}, ${age}, ${relationship}`);
            
            const query = 'INSERT INTO travel_group_members (preference_id, member_name, age, relationship) VALUES (?, ?, ?, ?)';
            
            db.query(query, [preference_id, name, age, relationship], (insertErr, result) => {
                if (insertErr) {
                    console.error(`❌ Error inserting ${name}:`, insertErr);
                    errors.push({ member: name, error: insertErr.message });
                } else {
                    inserted++;
                    console.log(`✅ Inserted: ${name} (ID: ${result.insertId})`);
                }
                
                completed++;
                
                if (completed === members.length) {
                    console.log(`🎉 Complete: ${inserted} inserted, ${errors.length} errors`);
                    
                    res.json({
                        success: true,
                        message: `${inserted} members inserted successfully`,
                        inserted: inserted,
                        preference_id: preference_id,
                        errors: errors.length > 0 ? errors : undefined
                    });
                }
            });
        });
    });
});

// ==================================================
// 💪 FORCE INSERT - DELETE OLD + INSERT NEW (from first file)
// ==================================================
router.post('/force-insert', (req, res) => {
    console.log('='.repeat(50));
    console.log('💪 FORCE INSERT REQUEST');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const { preference_id, members } = req.body;
    
    if (!preference_id) {
        return res.status(400).json({ 
            success: false, 
            message: 'preference_id is required' 
        });
    }
    
    if (!members || !Array.isArray(members)) {
        return res.status(400).json({ 
            success: false, 
            message: 'members array is required' 
        });
    }
    
    console.log(`📌 Preference ID: ${preference_id}`);
    console.log(`👥 Members to insert: ${members.length}`);
    
    // Check if preference exists
    db.query('SELECT * FROM travel_preferences WHERE preference_id = ?', [preference_id], (err, results) => {
        if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: `Preference ${preference_id} not found` 
            });
        }
        
        // STEP 1: DELETE ALL EXISTING MEMBERS
        db.query('DELETE FROM travel_group_members WHERE preference_id = ?', [preference_id], (delErr, delResult) => {
            if (delErr) {
                console.error('❌ Delete error:', delErr);
                return res.status(500).json({ 
                    success: false, 
                    error: delErr.message 
                });
            }
            
            console.log(`🗑️ Deleted ${delResult.affectedRows} existing members`);
            
            // STEP 2: INSERT NEW MEMBERS
            let inserted = 0;
            let errors = [];
            let completed = 0;
            
            if (members.length === 0) {
                return res.json({ 
                    success: true, 
                    message: 'No members to insert' 
                });
            }
            
            members.forEach((member) => {
                const name = member.name || 'Unknown';
                const age = member.age || 0;
                const relationship = member.relationship || 'Self';
                
                const query = 'INSERT INTO travel_group_members (preference_id, member_name, age, relationship) VALUES (?, ?, ?, ?)';
                
                db.query(query, [preference_id, name, age, relationship], (insertErr, result) => {
                    if (insertErr) {
                        console.error(`❌ Error inserting ${name}:`, insertErr);
                        errors.push({ member: name, error: insertErr.message });
                    } else {
                        inserted++;
                        console.log(`✅ Inserted: ${name} (ID: ${result.insertId})`);
                    }
                    
                    completed++;
                    
                    if (completed === members.length) {
                        console.log(`🎉 Force insert complete: ${inserted} inserted`);
                        
                        res.json({
                            success: true,
                            message: `${inserted} members force-inserted successfully`,
                            inserted: inserted,
                            preference_id: preference_id,
                            errors: errors.length > 0 ? errors : undefined
                        });
                    }
                });
            });
        });
    });
});

// ==================================================
// ✅ GET members by preference_id (from both files - using first file's version with logging)
// ==================================================
router.get('/:preference_id', (req, res) => {
    const prefId = req.params.preference_id;
    
    const query = 'SELECT * FROM travel_group_members WHERE preference_id = ? ORDER BY member_id ASC';
    
    db.query(query, [prefId], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        console.log(`📋 Found ${results.length} members for preference ${prefId}`);
        
        res.json({
            success: true,
            members: results,
            count: results.length,
            preference_id: prefId
        });
    });
});

// ==================================================
// ✅ GET ALL MEMBERS simple (from first file)
// ==================================================
router.get('/all/simple', (req, res) => {
    console.log('📋 Fetching ALL members (simple view)...');
    
    const query = 'SELECT * FROM travel_group_members ORDER BY member_id ASC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error fetching members:', err);
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        console.log(`📋 Total members in DB: ${results.length}`);
        
        res.json({
            success: true,
            total_members: results.length,
            members: results
        });
    });
});

// ==================================================
// ✅ GET ALL MEMBERS for a user (from first file)
// ==================================================
router.get('/user/:user_id', (req, res) => {
    const userId = req.params.user_id;
    
    const query = `
        SELECT tgm.*, tp.destination, tp.interests
        FROM travel_group_members tgm
        JOIN travel_preferences tp ON tgm.preference_id = tp.preference_id
        WHERE tp.user_id = ?
        ORDER BY tgm.member_id DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        res.json({
            success: true,
            user_id: userId,
            total_members: results.length,
            members: results
        });
    });
});

// ==================================================
// ✅ GET ALL MEMBERS with travel preferences and user details (from second file)
// ==================================================
router.get('/all/with-details', (req, res) => {
    console.log('📋 Fetching ALL members from travel_group_members table...');

    const query = `
        SELECT 
            tgm.member_id,
            tgm.preference_id,
            tgm.member_name,
            tgm.age,
            tgm.relationship,
            DATE_FORMAT(tgm.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
            tp.user_id,
            tp.destination,
            tp.start_date,
            tp.end_date,
            tp.duration_days,
            tp.budget_min,
            tp.budget_max,
            tp.travelers_count,
            tp.interests,
            tp.companion_type,
            tp.match_status,
            DATE_FORMAT(tp.created_at, '%Y-%m-%d %H:%i:%s') as preference_created_at,
            u.name as user_name,
            u.email as user_email
        FROM travel_group_members tgm
        LEFT JOIN travel_preferences tp ON tgm.preference_id = tp.preference_id
        LEFT JOIN users u ON tp.user_id = u.user_id
        ORDER BY tgm.member_id ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error fetching all members:', err);
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        console.log(`✅ Found ${results.length} total members in database`);

        // Log the range of member_ids found
        if (results.length > 0) {
            const firstId = results[0].member_id;
            const lastId = results[results.length - 1].member_id;
            console.log(`📊 Member ID range: ${firstId} to ${lastId}`);
        }

        // Parse JSON interests if they exist
        const processedResults = results.map(row => {
            if (row.interests) {
                try {
                    row.interests = JSON.parse(row.interests);
                } catch (e) {
                    row.interests = [];
                }
            }
            return row;
        });

        res.json({
            success: true,
            message: 'All member records fetched successfully',
            total_members: processedResults.length,
            member_id_range: results.length > 0 ? {
                first: results[0].member_id,
                last: results[results.length - 1].member_id
            } : null,
            members: processedResults
        });
    });
});

// ==================================================
// ✅ GET member by member_id (from second file)
// ==================================================
router.get('/member/:member_id', (req, res) => {
    const { member_id } = req.params;

    const query = `
        SELECT 
            tgm.*,
            tp.destination,
            tp.start_date,
            tp.end_date,
            u.name as user_name
        FROM travel_group_members tgm
        LEFT JOIN travel_preferences tp ON tgm.preference_id = tp.preference_id
        LEFT JOIN users u ON tp.user_id = u.user_id
        WHERE tgm.member_id = ?
    `;

    db.query(query, [member_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        res.json({
            success: true,
            member: results[0]
        });
    });
});

// ==================================================
// ✅ GET members count by preference_id (from second file)
// ==================================================
router.get('/stats/by-preference', (req, res) => {
    const query = `
        SELECT 
            preference_id,
            COUNT(*) as member_count,
            MIN(member_id) as first_member_id,
            MAX(member_id) as last_member_id
        FROM travel_group_members
        GROUP BY preference_id
        ORDER BY preference_id DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json({
            success: true,
            stats: results
        });
    });
});

// ==================================================
// ✅ DELETE member (from first file)
// ==================================================
router.delete('/member/:member_id', (req, res) => {
    const { member_id } = req.params;
    
    db.query('DELETE FROM travel_group_members WHERE member_id = ?', [member_id], (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Member deleted successfully'
        });
    });
});

export default router;