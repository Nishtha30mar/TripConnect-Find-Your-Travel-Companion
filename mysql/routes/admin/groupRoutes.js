// routes/admin/groupRoutes.js - NEW FILE (Sirf Group Approvals)
import express from 'express';
import { db } from '../../server.js';

const router = express.Router();

// GET - Fetch pending groups for admin
router.get('/pending', async(req, res) => {
    try {
        const [groups] = await db.query(`
            SELECT 
                g.group_id,
                g.destination,
                g.start_date,
                g.end_date,
                g.average_match_score,
                g.common_interests_count,
                g.created_at,
                g.status,
                COUNT(DISTINCT gm.user_id) as member_count,
                GROUP_CONCAT(DISTINCT u.name ORDER BY u.name SEPARATOR ', ') as member_names
            FROM travel_groups g
            LEFT JOIN group_members gm ON g.group_id = gm.group_id
            LEFT JOIN users u ON gm.user_id = u.user_id
            WHERE g.status = 'forming'
            GROUP BY g.group_id
            ORDER BY g.created_at DESC
        `);

        const formattedGroups = groups.map(group => ({
            group_id: group.group_id,
            group_name: `Trip to ${group.destination}`,
            destination: group.destination,
            start_date: group.start_date,
            end_date: group.end_date,
            match_score: group.average_match_score || 0,
            member_count: group.member_count || 0,
            status: group.status,
            members: group.member_names ? group.member_names.split(',').map(name => ({ name: name.trim() })) : []
        }));

        res.json(formattedGroups);

    } catch (error) {
        console.error('Error fetching pending groups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending groups',
            error: error.message
        });
    }
});

// GET - Fetch single group details with members
router.get('/:groupId', async(req, res) => {
    try {
        const { groupId } = req.params;

        const [groups] = await db.query(`
            SELECT 
                g.group_id,
                g.destination,
                g.start_date,
                g.end_date,
                g.average_match_score,
                g.common_interests_count,
                g.created_at,
                g.status
            FROM travel_groups g
            WHERE g.group_id = ?
        `, [groupId]);

        if (groups.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        const group = groups[0];

        const [members] = await db.query(`
            SELECT 
                u.user_id,
                u.name,
                u.email,
                u.gender,
                u.location,
                u.phone_number,
                gm.joined_at
            FROM group_members gm
            JOIN users u ON gm.user_id = u.user_id
            WHERE gm.group_id = ?
            ORDER BY gm.joined_at ASC
        `, [groupId]);

        const groupWithMembers = {
            group_id: group.group_id,
            group_name: `Trip to ${group.destination}`,
            destination: group.destination,
            start_date: group.start_date,
            end_date: group.end_date,
            match_score: group.average_match_score,
            compatibility: group.common_interests_count > 0 ?
                `${Math.round((group.common_interests_count / 5) * 100)}%` : 'N/A',
            status: group.status,
            members: members.map(m => ({
                user_id: m.user_id,
                name: m.name,
                email: m.email,
                location: m.location,
                gender: m.gender,
                phone: m.phone_number,
                joined_at: m.joined_at
            }))
        };

        res.json(groupWithMembers);

    } catch (error) {
        console.error('Error fetching group details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch group details'
        });
    }
});

// POST - Approve group
router.post('/:groupId/approve', async(req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { groupId } = req.params;

        const [groups] = await connection.query(
            'SELECT status FROM travel_groups WHERE group_id = ?', [groupId]
        );

        if (groups.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        if (groups[0].status !== 'forming') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Group cannot be approved. Current status: ${groups[0].status}`
            });
        }

        await connection.query(
            'UPDATE travel_groups SET status = "active" WHERE group_id = ?', [groupId]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Group approved successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error approving group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve group',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// POST - Reject group
router.post('/:groupId/reject', async(req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { groupId } = req.params;

        const [groups] = await connection.query(
            'SELECT status FROM travel_groups WHERE group_id = ?', [groupId]
        );

        if (groups.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        if (groups[0].status !== 'forming') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Group cannot be rejected. Current status: ${groups[0].status}`
            });
        }

        await connection.query(
            'UPDATE travel_groups SET status = "cancelled" WHERE group_id = ?', [groupId]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Group rejected successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error rejecting group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject group',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

export default router;