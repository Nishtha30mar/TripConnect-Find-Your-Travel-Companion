import express from 'express';
import { db } from '../../server.js';

const router = express.Router();

// Temporary admin auth (baad mein proper auth laga lena)
const authenticateAdmin = (req, res, next) => {
    // For now, allow all requests for testing
    // Aap ismein proper token verification baad mein laga sakte hain
    next();
};

// ============================================
// GET ALL SELF GROUPS
// URL: GET /api/admin/self-groups
// ============================================
router.get('/', authenticateAdmin, async(req, res) => {
    console.log('📥 [GET /api/admin/self-groups] Fetching self groups from travel_group_members...');

    try {
        // Pehle check karo ki table mein data hai ya nahi
        const [countCheck] = await db.query(`
            SELECT COUNT(*) as total FROM travel_group_members
        `);
        console.log(`📊 Total records in travel_group_members: ${countCheck[0].total}`);

        if (countCheck[0].total === 0) {
            console.log('ℹ️ No data found in travel_group_members table');
            return res.json({
                success: true,
                data: [],
                message: 'No self groups found'
            });
        }

        // Query to get groups grouped by preference_id
        const [groups] = await db.query(`
            SELECT 
                tpm.preference_id,
                COUNT(tpm.member_id) as member_count,
                MIN(tpm.created_at) as created_at,
                tp.destination,
                DATE_FORMAT(tp.start_date, '%Y-%m-%d') as start_date,
                DATE_FORMAT(tp.end_date, '%Y-%m-%d') as end_date,
                tp.match_status,
                u.name as creator_name,
                u.user_id as creator_id
            FROM travel_group_members tpm
            LEFT JOIN travel_preferences tp ON tpm.preference_id = tp.preference_id
            LEFT JOIN users u ON tp.user_id = u.user_id
            WHERE tpm.preference_id IS NOT NULL
            GROUP BY tpm.preference_id, tp.destination, tp.start_date, tp.end_date, tp.match_status, u.name, u.user_id
            ORDER BY MIN(tpm.created_at) DESC
        `);

        console.log(`✅ Found ${groups.length} groups`);

        // Format groups for frontend
        const formattedGroups = [];

        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];

            // Get members for this group
            const [members] = await db.query(`
                SELECT 
                    member_id,
                    member_name as name,
                    age,
                    relationship
                FROM travel_group_members
                WHERE preference_id = ?
                ORDER BY created_at ASC
            `, [group.preference_id]);

            let status = 'pending';
            if (group.match_status === 'confirmed') status = 'approved';
            else if (group.match_status === 'rejected') status = 'rejected';
            else if (group.match_status === 'matched') status = 'pending';

            formattedGroups.push({
                id: `SG-${group.preference_id}`,
                preference_id: group.preference_id,
                group_name: members.length > 0 ?
                    `${members[0].name}'s Trip to ${group.destination || 'Unknown Destination'}` :
                    `Trip to ${group.destination || 'Unknown Destination'}`,
                creator: group.creator_name || (members.length > 0 ? members[0].name : 'Unknown'),
                creator_id: group.creator_id,
                package_name: group.destination ? `${group.destination} Tour` : 'Custom Package',
                destination: group.destination || 'Not specified',
                member_count: group.member_count,
                max_members: 10,
                travel_date: group.start_date,
                status: status,
                created_at: group.created_at,
                processed_at: group.match_status === 'confirmed' || group.match_status === 'rejected' ?
                    new Date().toISOString() :
                    null,
                members: members.map(m => ({
                    name: m.name,
                    age: m.age,
                    relationship: m.relationship,
                    member_id: m.member_id
                }))
            });
        }

        res.json({
            success: true,
            data: formattedGroups
        });

    } catch (error) {
        console.error('❌ Error fetching self groups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch self groups',
            error: error.message
        });
    }
});

// ============================================
// APPROVE SELF GROUP
// URL: POST /api/admin/self-groups/:preferenceId/approve
// ============================================
router.post('/:preferenceId/approve', authenticateAdmin, async(req, res) => {
    const { preferenceId } = req.params;
    console.log(`📥 [POST /api/admin/self-groups/${preferenceId}/approve] Approving group...`);

    try {
        await db.query('START TRANSACTION');

        // Update travel_preferences status
        const [updateResult] = await db.query(`
            UPDATE travel_preferences 
            SET match_status = 'confirmed', 
                updated_at = NOW() 
            WHERE preference_id = ?
        `, [preferenceId]);

        if (updateResult.affectedRows === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Get group details to create travel group
        const [prefData] = await db.query(`
            SELECT destination, start_date, end_date, user_id
            FROM travel_preferences 
            WHERE preference_id = ?
        `, [preferenceId]);

        if (prefData.length > 0) {
            const pref = prefData[0];

            // Create travel group
            const [groupResult] = await db.query(`
                INSERT INTO travel_groups 
                (destination, start_date, end_date, status, created_at)
                VALUES (?, ?, ?, 'active', NOW())
            `, [pref.destination, pref.start_date, pref.end_date]);

            const groupId = groupResult.insertId;

            // Add all members to the group
            await db.query(`
                INSERT INTO group_members (group_id, user_id, status, joined_at)
                SELECT ?, user_id, 'accepted', NOW()
                FROM travel_group_members 
                WHERE preference_id = ?
            `, [groupId, preferenceId]);

            console.log(`✅ Created travel group ${groupId} with ${groupId} members`);
        }

        await db.query('COMMIT');

        res.json({
            success: true,
            message: 'Group approved successfully',
            data: {
                preference_id: preferenceId
            }
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('❌ Error approving group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve group',
            error: error.message
        });
    }
});

// ============================================
// REJECT SELF GROUP
// URL: POST /api/admin/self-groups/:preferenceId/reject
// ============================================
router.post('/:preferenceId/reject', authenticateAdmin, async(req, res) => {
    const { preferenceId } = req.params;
    console.log(`📥 [POST /api/admin/self-groups/${preferenceId}/reject] Rejecting group...`);

    try {
        const [updateResult] = await db.query(`
            UPDATE travel_preferences 
            SET match_status = 'rejected', 
                updated_at = NOW() 
            WHERE preference_id = ?
        `, [preferenceId]);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        res.json({
            success: true,
            message: 'Group rejected successfully'
        });

    } catch (error) {
        console.error('❌ Error rejecting group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject group',
            error: error.message
        });
    }
});

// ============================================
// GET GROUP DETAILS BY PREFERENCE ID
// URL: GET /api/admin/self-groups/:preferenceId
// ============================================
router.get('/:preferenceId', authenticateAdmin, async(req, res) => {
    const { preferenceId } = req.params;
    console.log(`📥 [GET /api/admin/self-groups/${preferenceId}] Fetching group details...`);

    try {
        // Get group info
        const [groups] = await db.query(`
            SELECT 
                tpm.preference_id,
                COUNT(tpm.member_id) as member_count,
                tp.destination,
                DATE_FORMAT(tp.start_date, '%Y-%m-%d') as start_date,
                DATE_FORMAT(tp.end_date, '%Y-%m-%d') as end_date,
                tp.match_status,
                u.name as creator_name,
                u.user_id as creator_id
            FROM travel_group_members tpm
            LEFT JOIN travel_preferences tp ON tpm.preference_id = tp.preference_id
            LEFT JOIN users u ON tp.user_id = u.user_id
            WHERE tpm.preference_id = ?
            GROUP BY tpm.preference_id, tp.destination, tp.start_date, tp.end_date, tp.match_status, u.name, u.user_id
        `, [preferenceId]);

        if (groups.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        const group = groups[0];

        // Get all members
        const [members] = await db.query(`
            SELECT 
                member_id,
                member_name as name,
                age,
                relationship,
                created_at as joined_at
            FROM travel_group_members
            WHERE preference_id = ?
            ORDER BY created_at ASC
        `, [preferenceId]);

        res.json({
            success: true,
            data: {
                preference_id: group.preference_id,
                destination: group.destination,
                start_date: group.start_date,
                end_date: group.end_date,
                status: group.match_status,
                member_count: group.member_count,
                creator: {
                    name: group.creator_name,
                    id: group.creator_id
                },
                members: members
            }
        });

    } catch (error) {
        console.error('❌ Error fetching group details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch group details',
            error: error.message
        });
    }
});

export default router;