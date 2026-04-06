import express from 'express';
import db from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tripconnect-secret-key-2024';

// Helper function to format date for MySQL
const formatDateForMySQL = (date) => {
    if (!date) return null;
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
    }
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

// Helper function to check if a user has any active group
const checkUserHasActiveGroup = async (userId) => {
    const [groups] = await db.promise().query(`
        SELECT 
            g.group_id,
            g.destination,
            DATE_FORMAT(g.start_date, '%Y-%m-%d') as start_date,
            DATE_FORMAT(g.end_date, '%Y-%m-%d') as end_date,
            g.status,
            g.average_match_score
        FROM travel_groups g
        INNER JOIN group_members gm ON g.group_id = gm.group_id
        WHERE gm.user_id = ? 
        AND g.status IN ('forming', 'active')
        LIMIT 1
    `, [userId]);
    
    return groups.length > 0 ? groups[0] : null;
};

// Helper function to get all active groups for a user
const getAllActiveGroupsForUser = async (userId) => {
    const [groups] = await db.promise().query(`
        SELECT 
            g.group_id,
            g.destination,
            DATE_FORMAT(g.start_date, '%Y-%m-%d') as start_date,
            DATE_FORMAT(g.end_date, '%Y-%m-%d') as end_date,
            g.status,
            g.average_match_score,
            COUNT(DISTINCT gm2.user_id) as member_count
        FROM travel_groups g
        INNER JOIN group_members gm ON g.group_id = gm.group_id
        LEFT JOIN group_members gm2 ON g.group_id = gm2.group_id
        WHERE gm.user_id = ? 
        AND g.status IN ('forming', 'active')
        GROUP BY g.group_id
    `, [userId]);
    
    return groups;
};

// Helper function to leave a group and delete if empty
const leaveGroupAndDeleteIfEmpty = async (groupId, userId) => {
    // Check if user is a member
    const [memberCheck] = await db.promise().query(`
        SELECT * FROM group_members 
        WHERE group_id = ? AND user_id = ?
    `, [groupId, userId]);

    if (memberCheck.length === 0) {
        return { success: false, was_deleted: false };
    }

    // Remove user from group
    await db.promise().query(`
        DELETE FROM group_members 
        WHERE group_id = ? AND user_id = ?
    `, [groupId, userId]);

    // Update user's match status
    await db.promise().query(`
        UPDATE travel_preferences 
        SET match_status = 'searching' 
        WHERE user_id = ?
    `, [userId]);

    // Check if group has any members left
    const [remainingMembers] = await db.promise().query(`
        SELECT COUNT(*) as count FROM group_members 
        WHERE group_id = ?
    `, [groupId]);

    let wasDeleted = false;
    
    if (remainingMembers[0].count === 0) {
        // Delete empty group from database
        await db.promise().query(`
            DELETE FROM travel_groups WHERE group_id = ?
        `, [groupId]);
        console.log(`🗑️ Group ${groupId} permanently deleted from database (no members left)`);
        wasDeleted = true;
    } else {
        // Update group average match score
        const [members] = await db.promise().query(`
            SELECT match_score FROM group_members 
            WHERE group_id = ? AND match_score IS NOT NULL
        `, [groupId]);
        
        if (members.length > 0) {
            const avgScore = Math.round(
                members.reduce((sum, m) => sum + m.match_score, 0) / members.length
            );
            
            await db.promise().query(`
                UPDATE travel_groups 
                SET average_match_score = ? 
                WHERE group_id = ?
            `, [avgScore, groupId]);
        }
    }
    
    return { success: true, was_deleted: wasDeleted };
};

// Helper function to leave all groups for a user and delete empty ones
const leaveAllGroupsForUser = async (userId) => {
    const groups = await getAllActiveGroupsForUser(userId);
    const leftGroups = [];
    
    for (const group of groups) {
        const result = await leaveGroupAndDeleteIfEmpty(group.group_id, userId);
        leftGroups.push({
            group_id: group.group_id,
            destination: group.destination,
            was_deleted: result.was_deleted,
            member_count_before: group.member_count
        });
    }
    
    return leftGroups;
};

// Helper function to check if a user has date conflict with existing groups
const checkUserDateConflict = async (userId, startDate, endDate, excludeGroupId = null) => {
    let query = `
        SELECT 
            g.group_id,
            g.destination,
            DATE_FORMAT(g.start_date, '%Y-%m-%d') as start_date,
            DATE_FORMAT(g.end_date, '%Y-%m-%d') as end_date,
            g.status,
            COUNT(DISTINCT gm.user_id) as member_count
        FROM travel_groups g
        INNER JOIN group_members gm ON g.group_id = gm.group_id
        WHERE gm.user_id = ? 
        AND g.status IN ('forming', 'active')
        AND g.start_date <= ? 
        AND g.end_date >= ?
    `;
    
    const params = [userId, endDate, startDate];
    
    if (excludeGroupId) {
        query += ` AND g.group_id != ?`;
        params.push(excludeGroupId);
    }
    
    query += ` GROUP BY g.group_id`;
    
    const [conflicts] = await db.promise().query(query, params);
    return conflicts.length > 0 ? conflicts : [];
};

// Helper function to get all members of a group with their preferences
const getGroupMembersWithPreferences = async (groupId) => {
    const [members] = await db.promise().query(`
        SELECT 
            gm.user_id,
            gm.match_score,
            tp.destination,
            DATE_FORMAT(tp.start_date, '%Y-%m-%d') as start_date,
            DATE_FORMAT(tp.end_date, '%Y-%m-%d') as end_date,
            tp.interests,
            tp.budget_min,
            tp.budget_max,
            tp.travelers_count,
            u.name
        FROM group_members gm
        JOIN users u ON gm.user_id = u.user_id
        JOIN travel_preferences tp ON gm.user_id = tp.user_id
        WHERE gm.group_id = ?
    `, [groupId]);
    
    return members;
};

// Helper function to calculate match score between two users
const calculateMatchScore = (user1, user2) => {
    // Parse interests
    let interests1 = [];
    let interests2 = [];
    
    if (user1.interests) {
        if (Array.isArray(user1.interests)) {
            interests1 = user1.interests;
        } else if (typeof user1.interests === 'string') {
            try {
                interests1 = JSON.parse(user1.interests);
            } catch (e) {
                interests1 = user1.interests.split(',').map(i => i.trim());
            }
        }
    }
    
    if (user2.interests) {
        if (Array.isArray(user2.interests)) {
            interests2 = user2.interests;
        } else if (typeof user2.interests === 'string') {
            try {
                interests2 = JSON.parse(user2.interests);
            } catch (e) {
                interests2 = user2.interests.split(',').map(i => i.trim());
            }
        }
    }
    
    // Calculate interest match
    const commonInterests = interests1.filter(interest =>
        interests2.some(i => i.toLowerCase() === interest.toLowerCase())
    );
    
    const interestMatchScore = interests1.length > 0 
        ? Math.round((commonInterests.length / interests1.length) * 100)
        : 0;
    
    // Check date overlap
    let dateScore = 0;
    if (user1.start_date && user1.end_date && user2.start_date && user2.end_date) {
        const overlap = datesOverlap(user1.start_date, user1.end_date, user2.start_date, user2.end_date);
        if (overlap) {
            const overlapDays = getOverlapDays(user1.start_date, user1.end_date, user2.start_date, user2.end_date);
            const duration1 = getDurationInDays(user1.start_date, user1.end_date);
            dateScore = Math.min(100, (overlapDays / duration1) * 100);
        }
    }
    
    // Destination match
    const destinationScore = user1.destination && user2.destination && 
        user1.destination.toLowerCase() === user2.destination.toLowerCase() ? 100 : 0;
    
    // Weighted score (40% interests, 30% dates, 30% destination)
    const weightedScore = Math.round(
        (interestMatchScore * 0.4) + 
        (dateScore * 0.3) + 
        (destinationScore * 0.3)
    );
    
    return Math.min(100, Math.max(0, weightedScore));
};

// Helper function to calculate group average match score
const calculateGroupAverageScore = (members) => {
    if (members.length <= 1) return 0;
    
    let totalScore = 0;
    let pairCount = 0;
    
    for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
            totalScore += calculateMatchScore(members[i], members[j]);
            pairCount++;
        }
    }
    
    return pairCount > 0 ? Math.round(totalScore / pairCount) : 0;
};

// Helper function to find common interests across group
const findCommonInterestsCount = (members) => {
    if (members.length === 0) return 0;
    
    const allInterests = [];
    members.forEach(member => {
        let interests = [];
        if (member.interests) {
            if (Array.isArray(member.interests)) {
                interests = member.interests;
            } else if (typeof member.interests === 'string') {
                try {
                    interests = JSON.parse(member.interests);
                } catch (e) {
                    interests = member.interests.split(',').map(i => i.trim());
                }
            }
        }
        allInterests.push(interests.map(i => i.toLowerCase()));
    });
    
    if (allInterests.length === 0) return 0;
    
    const interestCounts = {};
    allInterests.forEach(interests => {
        const uniqueInterests = [...new Set(interests)];
        uniqueInterests.forEach(interest => {
            interestCounts[interest] = (interestCounts[interest] || 0) + 1;
        });
    });
    
    const threshold = Math.ceil(members.length / 2);
    return Object.values(interestCounts).filter(count => count >= threshold).length;
};

// Helper function to find optimal group members
const findOptimalGroupMembers = async (currentUser, allAvailableUsers, existingGroupMembers = []) => {
    // Combine existing group members with potential new members
    let candidatePool = [...existingGroupMembers];
    
    // Add current user if not already in pool
    if (!candidatePool.some(m => m.user_id === currentUser.user_id)) {
        candidatePool.push(currentUser);
    }
    
    // Add available users
    candidatePool.push(...allAvailableUsers);
    
    // Remove duplicates
    const uniquePool = [];
    const userIds = new Set();
    for (const user of candidatePool) {
        if (!userIds.has(user.user_id)) {
            userIds.add(user.user_id);
            uniquePool.push(user);
        }
    }
    
    // Calculate all pairwise scores
    const scores = {};
    for (let i = 0; i < uniquePool.length; i++) {
        for (let j = i + 1; j < uniquePool.length; j++) {
            const score = calculateMatchScore(uniquePool[i], uniquePool[j]);
            const key1 = `${uniquePool[i].user_id}_${uniquePool[j].user_id}`;
            const key2 = `${uniquePool[j].user_id}_${uniquePool[i].user_id}`;
            scores[key1] = score;
            scores[key2] = score;
        }
    }
    
    // Greedy algorithm to select best group (max 10 members)
    const selectedMembers = [currentUser];
    const remainingUsers = uniquePool.filter(u => u.user_id !== currentUser.user_id);
    
    while (selectedMembers.length < 10 && remainingUsers.length > 0) {
        let bestUser = null;
        let bestAverageScore = -1;
        
        for (const user of remainingUsers) {
            // Calculate average score with current selected members
            let totalScore = 0;
            for (const member of selectedMembers) {
                const key = `${member.user_id}_${user.user_id}`;
                totalScore += scores[key] || 0;
            }
            const avgScore = totalScore / selectedMembers.length;
            
            if (avgScore > bestAverageScore) {
                bestAverageScore = avgScore;
                bestUser = user;
            }
        }
        
        if (bestUser && bestAverageScore >= 40) {
            selectedMembers.push(bestUser);
            const index = remainingUsers.indexOf(bestUser);
            remainingUsers.splice(index, 1);
        } else {
            break;
        }
    }
    
    return selectedMembers;
};

// Helper function to get users not in any active group
const getAvailableUsers = async () => {
    const [users] = await db.promise().query(`
        SELECT DISTINCT 
            u.user_id,
            u.name,
            u.email,
            tp.destination,
            DATE_FORMAT(tp.start_date, '%Y-%m-%d') as start_date,
            DATE_FORMAT(tp.end_date, '%Y-%m-%d') as end_date,
            tp.interests,
            tp.budget_min,
            tp.budget_max,
            tp.travelers_count,
            tp.companion_type
        FROM users u
        INNER JOIN travel_preferences tp ON u.user_id = tp.user_id
        WHERE u.user_id NOT IN (
            SELECT DISTINCT gm.user_id 
            FROM group_members gm
            INNER JOIN travel_groups g ON gm.group_id = g.group_id
            WHERE g.status IN ('forming', 'active')
        )
        AND tp.match_status != 'matched'
    `);
    
    return users;
};

// Helper function to get all active groups with their members
const getAllActiveGroups = async () => {
    const [groups] = await db.promise().query(`
        SELECT 
            g.group_id,
            g.destination,
            DATE_FORMAT(g.start_date, '%Y-%m-%d') as start_date,
            DATE_FORMAT(g.end_date, '%Y-%m-%d') as end_date,
            g.average_match_score,
            g.common_interests_count,
            g.status
        FROM travel_groups g
        WHERE g.status IN ('forming', 'active')
        ORDER BY g.average_match_score DESC
    `);
    
    const groupsWithMembers = [];
    for (const group of groups) {
        const members = await getGroupMembersWithPreferences(group.group_id);
        groupsWithMembers.push({
            ...group,
            members: members
        });
    }
    
    return groupsWithMembers;
};

// Date helper functions
function datesOverlap(start1, end1, start2, end2) {
    if (!start1 || !end1 || !start2 || !end2) return false;
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    return s1 <= e2 && s2 <= e1;
}

function getOverlapDays(start1, end1, start2, end2) {
    if (!datesOverlap(start1, end1, start2, end2)) return 0;
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    const overlapStart = new Date(Math.max(s1, s2));
    const overlapEnd = new Date(Math.min(e1, e2));
    const diffTime = Math.abs(overlapEnd - overlapStart);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getDurationInDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

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
// CREATE A NEW GROUP (with auto-leave and auto-delete)
// URL: POST /api/groups
// ============================================
router.post('/', authenticateToken, async (req, res) => {
    const {
        destination,
        start_date,
        end_date,
        average_match_score,
        common_interests_count,
        members
    } = req.body;

    const formattedStartDate = formatDateForMySQL(start_date);
    const formattedEndDate = formatDateForMySQL(end_date);

    console.log('📥 [POST /api/groups] Creating new group:', { 
        destination, 
        start_date: formattedStartDate, 
        end_date: formattedEndDate, 
        members_count: members?.length 
    });

    try {
        if (!formattedStartDate || !formattedEndDate) {
            return res.status(400).json({
                success: false,
                message: 'Invalid start or end date'
            });
        }

        const allUserIds = members.map(m => m.user_id);
        const usersWithConflicts = [];
        const usersRemovedFromGroups = [];

        // First, automatically remove all users from their existing groups
        console.log('🔄 Automatically removing users from existing groups...');
        
        for (const userId of allUserIds) {
            const activeGroups = await getAllActiveGroupsForUser(userId);
            if (activeGroups.length > 0) {
                console.log(`   User ${userId} has ${activeGroups.length} active group(s). Auto-leaving...`);
                const leftGroups = await leaveAllGroupsForUser(userId);
                usersRemovedFromGroups.push({
                    user_id: userId,
                    left_groups: leftGroups
                });
            }
        }

        // Now check for date conflicts (should be none since we removed all groups)
        for (const userId of allUserIds) {
            const conflicts = await checkUserDateConflict(userId, formattedStartDate, formattedEndDate);
            if (conflicts.length > 0) {
                usersWithConflicts.push({
                    user_id: userId,
                    conflicts: conflicts
                });
            }
        }

        if (usersWithConflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Some users have date conflicts even after removing existing groups',
                conflicts: usersWithConflicts
            });
        }

        await db.promise().query('START TRANSACTION');

        // Create new group
        const [groupResult] = await db.promise().query(`
            INSERT INTO travel_groups 
            (destination, start_date, end_date, average_match_score, common_interests_count, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'active', NOW())
        `, [destination, formattedStartDate, formattedEndDate, average_match_score || null, common_interests_count || 0]);

        const groupId = groupResult.insertId;
        console.log(`✅ New group created with ID: ${groupId}`);

        // Add all members to new group
        if (members && members.length > 0) {
            for (const member of members) {
                await db.promise().query(`
                    INSERT INTO group_members (group_id, user_id, match_score, status, joined_at)
                    VALUES (?, ?, ?, 'accepted', NOW())
                `, [groupId, member.user_id, member.match_score || null]);
                
                await db.promise().query(`
                    UPDATE travel_preferences 
                    SET match_status = 'matched' 
                    WHERE user_id = ?
                `, [member.user_id]);
                
                console.log(`   Added member: ${member.user_id} to new group`);
            }
        }

        await db.promise().query('COMMIT');

        res.json({
            success: true,
            message: `Group created successfully. ${usersRemovedFromGroups.length} users were automatically removed from their previous groups.`,
            group_id: groupId,
            data: {
                group_id: groupId,
                members_count: members ? members.length : 0,
                users_removed_from_old_groups: usersRemovedFromGroups
            }
        });

    } catch (error) {
        await db.promise().query('ROLLBACK');
        console.error('❌ Error creating group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create group',
            error: error.message
        });
    }
});

// ============================================
// GET USER'S ACTIVE GROUPS
// URL: GET /api/groups/user/:userId/active
// ============================================
router.get('/user/:userId/active', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    
    console.log(`📥 [GET /api/groups/user/${userId}/active] Checking active groups`);
    
    if (userId !== req.userId) {
        return res.status(403).json({
            success: false,
            message: 'You can only check your own active groups'
        });
    }
    
    try {
        const [activeGroups] = await db.promise().query(`
            SELECT 
                g.group_id,
                g.destination,
                DATE_FORMAT(g.start_date, '%Y-%m-%d') as start_date,
                DATE_FORMAT(g.end_date, '%Y-%m-%d') as end_date,
                g.status,
                g.average_match_score,
                COUNT(DISTINCT gm.user_id) as member_count
            FROM travel_groups g
            INNER JOIN group_members gm ON g.group_id = gm.group_id
            WHERE gm.user_id = ? 
            AND g.status IN ('forming', 'active')
            GROUP BY g.group_id
            ORDER BY g.start_date ASC
        `, [userId]);
        
        if (activeGroups.length > 0) {
            console.log(`✅ Found ${activeGroups.length} active group(s) for user ${userId}`);
            return res.json({
                success: true,
                has_active_group: true,
                data: {
                    group: activeGroups[0],
                    all_groups: activeGroups
                }
            });
        }
        
        res.json({
            success: true,
            has_active_group: false,
            data: null
        });
        
    } catch (error) {
        console.error('❌ Error checking active groups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check active groups',
            error: error.message
        });
    }
});

// ============================================
// GET ALL ACTIVE GROUPS FOR CURRENT USER
// URL: GET /api/groups/user/all-active
// ============================================
router.get('/user/all-active', authenticateToken, async (req, res) => {
    console.log(`📥 [GET /api/groups/user/all-active] Fetching all active groups for user: ${req.userId}`);
    
    try {
        const [activeGroups] = await db.promise().query(`
            SELECT 
                g.group_id,
                g.destination,
                DATE_FORMAT(g.start_date, '%Y-%m-%d') as start_date,
                DATE_FORMAT(g.end_date, '%Y-%m-%d') as end_date,
                g.status,
                g.average_match_score,
                g.common_interests_count,
                DATE_FORMAT(g.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
                COUNT(DISTINCT gm.user_id) as members_count
            FROM travel_groups g
            INNER JOIN group_members gm ON g.group_id = gm.group_id
            WHERE gm.user_id = ? 
            AND g.status IN ('forming', 'active')
            GROUP BY g.group_id
            ORDER BY g.start_date ASC
        `, [req.userId]);
        
        console.log(`✅ Found ${activeGroups.length} active group(s) for user ${req.userId}`);
        
        const groupsWithMembers = [];
        for (const group of activeGroups) {
            const [members] = await db.promise().query(`
                SELECT 
                    gm.user_id,
                    gm.match_score,
                    u.name,
                    u.email,
                    DATE_FORMAT(gm.joined_at, '%Y-%m-%d %H:%i:%s') as joined_at
                FROM group_members gm
                JOIN users u ON gm.user_id = u.user_id
                WHERE gm.group_id = ?
                ORDER BY gm.joined_at ASC
            `, [group.group_id]);
            
            groupsWithMembers.push({
                ...group,
                members: members
            });
        }
        
        res.json({
            success: true,
            groups: groupsWithMembers
        });
        
    } catch (error) {
        console.error('❌ Error fetching active groups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active groups',
            error: error.message
        });
    }
});

// ============================================
// GET ALL GROUPS (for matching algorithm)
// URL: GET /api/groups/all
// ============================================
router.get('/all', authenticateToken, async (req, res) => {
    console.log('📥 [GET /api/groups/all] Fetching all active groups');
    
    try {
        const [groups] = await db.promise().query(`
            SELECT 
                g.group_id,
                g.destination,
                DATE_FORMAT(g.start_date, '%Y-%m-%d') as start_date,
                DATE_FORMAT(g.end_date, '%Y-%m-%d') as end_date,
                g.average_match_score,
                g.common_interests_count,
                g.status,
                DATE_FORMAT(g.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
                COUNT(DISTINCT gm.user_id) as member_count
            FROM travel_groups g
            LEFT JOIN group_members gm ON g.group_id = gm.group_id
            WHERE g.status IN ('forming', 'active')
            GROUP BY g.group_id
            HAVING member_count < 10
            ORDER BY g.created_at DESC
        `);
        
        const groupsWithMembers = [];
        for (const group of groups) {
            const [members] = await db.promise().query(`
                SELECT 
                    gm.user_id,
                    gm.match_score,
                    u.name,
                    DATE_FORMAT(gm.joined_at, '%Y-%m-%d %H:%i:%s') as joined_at
                FROM group_members gm
                JOIN users u ON gm.user_id = u.user_id
                WHERE gm.group_id = ?
                ORDER BY gm.joined_at ASC
            `, [group.group_id]);
            
            groupsWithMembers.push({
                ...group,
                members: members
            });
        }
        
        console.log(`✅ Found ${groupsWithMembers.length} active groups`);
        
        res.json({
            success: true,
            data: groupsWithMembers
        });
        
    } catch (error) {
        console.error('❌ Error fetching all groups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch groups',
            error: error.message
        });
    }
});

// ============================================
// LEAVE GROUP (with auto-delete)
// URL: POST /api/groups/:groupId/leave
// ============================================
router.post('/:groupId/leave', authenticateToken, async (req, res) => {
    const { groupId } = req.params;
    console.log(`📥 [POST /api/groups/${groupId}/leave] User ${req.userId} leaving group`);

    try {
        const [memberCheck] = await db.promise().query(`
            SELECT * FROM group_members 
            WHERE group_id = ? AND user_id = ?
        `, [groupId, req.userId]);

        if (memberCheck.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        await db.promise().query('START TRANSACTION');

        const result = await leaveGroupAndDeleteIfEmpty(groupId, req.userId);

        await db.promise().query('COMMIT');

        res.json({
            success: true,
            message: result.was_deleted 
                ? 'Successfully left the group. The group was empty and has been deleted.' 
                : 'Successfully left the group',
            group_deleted: result.was_deleted
        });

    } catch (error) {
        await db.promise().query('ROLLBACK');
        console.error('❌ Error leaving group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to leave group',
            error: error.message
        });
    }
});

// Keep all other routes (GET, POST, etc.) from your original file
// ... (include all other routes like /check-conflicts, /available-users, etc.)

export default router;