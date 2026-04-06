// routes/preferenceRoutes.js
import express from 'express';
import db from '../db.js';

const router = express.Router();

// ============================================
// HELPER FUNCTIONS
// ============================================

const cleanUserId = (userId) => {
    if (!userId) return userId;
    return String(userId).trim();
};

// Helper function to format date for MySQL
const formatDateForMySQL = (date) => {
    if (!date) return null;
    // If it's already in YYYY-MM-DD format
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
    }
    // Convert ISO date to YYYY-MM-DD
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
    } catch (e) {
        console.error('Error formatting date:', e);
        return null;
    }
};

const parseInterests = (interestsField) => {
    if (!interestsField) return [];
    
    try {
        if (Array.isArray(interestsField)) {
            return interestsField;
        }
        if (typeof interestsField === 'string') {
            if (interestsField.startsWith('[') && interestsField.endsWith(']')) {
                return JSON.parse(interestsField);
            } else {
                return [interestsField];
            }
        }
        if (typeof interestsField === 'object') {
            return Array.isArray(interestsField) ? interestsField : [interestsField];
        }
    } catch (e) {
        console.error('Error parsing interests:', e);
    }
    return [];
};

const processInterestsForDB = (interests) => {
    if (!interests) return JSON.stringify([]);
    
    try {
        if (Array.isArray(interests)) {
            return JSON.stringify(interests);
        } 
        else if (typeof interests === 'string') {
            try {
                // Try to parse if it's JSON string
                const parsed = JSON.parse(interests);
                return JSON.stringify(parsed);
            } catch {
                // If not valid JSON, treat as single interest
                return JSON.stringify([interests]);
            }
        }
        else if (typeof interests === 'object') {
            return JSON.stringify(interests);
        }
    } catch (e) {
        console.error('Error processing interests for DB:', e);
    }
    return JSON.stringify([]);
};

// ============================================
// FIND MATCHES AND CREATE GROUP
// ============================================

async function findAndCreateGroups(preferenceData) {
    try {
        const { 
            user_id, 
            destination, 
            start_date, 
            end_date, 
            interests, 
            companion_type,
            budget_min,
            budget_max,
            travelers_count,
            duration_days
        } = preferenceData;
        
        // Format dates for MySQL
        const formattedStartDate = formatDateForMySQL(start_date);
        const formattedEndDate = formatDateForMySQL(end_date);
        
        // Parse interests if it's a string
        let parsedInterests = interests;
        if (typeof interests === 'string') {
            try {
                parsedInterests = JSON.parse(interests);
            } catch (e) {
                parsedInterests = [];
            }
        }
        
        // Check if user has valid preferences for matching
        if (!parsedInterests || parsedInterests.length === 0) {
            console.log('❌ No interests provided, skipping group creation');
            return null;
        }
        
        if (!companion_type) {
            console.log('❌ No companion type provided, skipping group creation');
            return null;
        }
        
        console.log(`🔍 Looking for matches for user: ${user_id}`);
        console.log(`   Destination: ${destination}, Dates: ${formattedStartDate} to ${formattedEndDate}`);
        
        // Find other users with similar preferences
        const [matches] = await db.promise().query(`
            SELECT 
                tp.user_id,
                tp.travelers_count,
                tp.budget_min,
                tp.budget_max,
                tp.interests,
                tp.companion_type,
                tp.duration_days,
                u.name,
                u.location,
                u.email
            FROM travel_preferences tp
            JOIN users u ON tp.user_id = u.user_id
            WHERE tp.destination = ?
                AND tp.start_date = ?
                AND tp.end_date = ?
                AND tp.user_id != ?
                AND (tp.match_status = 'pending' OR tp.match_status = 'searching')
                AND tp.companion_type IS NOT NULL
                AND tp.companion_type != 'null'
                AND tp.interests IS NOT NULL
                AND tp.interests != '[]'
                AND tp.interests != 'null'
        `, [destination, formattedStartDate, formattedEndDate, user_id]);
        
        console.log(`📊 Found ${matches.length} potential matches for user ${user_id}`);
        
        if (matches.length === 0) {
            console.log('ℹ️ No matches found for user:', user_id);
            return null;
        }
        
        // Calculate match scores for each potential match
        const scoredMatches = matches.map(match => {
            let score = 0;
            
            // 1. Budget compatibility (30 points)
            const budgetMin = parseInt(budget_min) || 0;
            const budgetMax = parseInt(budget_max) || 0;
            const matchBudgetMin = parseInt(match.budget_min) || 0;
            const matchBudgetMax = parseInt(match.budget_max) || 0;
            
            if (budgetMin <= matchBudgetMax && budgetMax >= matchBudgetMin) {
                score += 30;
            } else if (Math.abs(budgetMax - matchBudgetMax) < 10000) {
                score += 15;
            }
            
            // 2. Travelers count compatibility (20 points)
            const travelers = parseInt(travelers_count) || 1;
            const matchTravelers = parseInt(match.travelers_count) || 1;
            
            if (travelers === matchTravelers) {
                score += 20;
            } else if (Math.abs(travelers - matchTravelers) === 1) {
                score += 10;
            }
            
            // 3. Companion type compatibility (20 points)
            if (companion_type === match.companion_type) {
                score += 20;
            }
            
            // 4. Interests match (30 points)
            let matchInterests = [];
            try {
                if (typeof match.interests === 'string') {
                    matchInterests = JSON.parse(match.interests);
                } else if (Array.isArray(match.interests)) {
                    matchInterests = match.interests;
                }
            } catch (e) {
                matchInterests = [];
            }
            
            const commonInterests = parsedInterests.filter(interest => 
                matchInterests.includes(interest)
            );
            
            const totalInterests = Math.max(parsedInterests.length, matchInterests.length);
            const interestScore = totalInterests > 0 ? (commonInterests.length / totalInterests) * 30 : 0;
            score += interestScore;
            
            console.log(`   Match with ${match.name}: Score = ${score.toFixed(2)} (Common interests: ${commonInterests.length})`);
            
            return {
                ...match,
                match_score: score,
                common_interests_count: commonInterests.length,
                common_interests: commonInterests
            };
        });
        
        // Filter matches with good score (>60)
        const goodMatches = scoredMatches.filter(match => match.match_score >= 60);
        
        if (goodMatches.length === 0) {
            console.log('ℹ️ No good matches found (score < 60) for user:', user_id);
            return null;
        }
        
        // Sort by match score
        goodMatches.sort((a, b) => b.match_score - a.match_score);
        
        // Create a group with the best match
        const bestMatch = goodMatches[0];
        const averageScore = (bestMatch.match_score + 100) / 2; // Assuming user's own score is 100
        
        console.log(`🎉 Creating group with best match: ${bestMatch.name} (Score: ${bestMatch.match_score.toFixed(2)})`);
        
        // Start transaction
        await db.promise().query('START TRANSACTION');
        
        try {
            // Create group with formatted dates
            const [groupResult] = await db.promise().query(`
                INSERT INTO travel_groups 
                (destination, start_date, end_date, average_match_score, common_interests_count, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'forming', NOW())
            `, [destination, formattedStartDate, formattedEndDate, Math.round(averageScore), bestMatch.common_interests_count]);
            
            const groupId = groupResult.insertId;
            console.log(`✅ Group created with ID: ${groupId}`);
            
            // Add current user to the group
            await db.promise().query(`
                INSERT INTO group_members (group_id, user_id, match_score, status, joined_at)
                VALUES (?, ?, ?, 'accepted', NOW())
            `, [groupId, user_id, 100]);
            
            // Add matched user to the group
            await db.promise().query(`
                INSERT INTO group_members (group_id, user_id, match_score, status, joined_at)
                VALUES (?, ?, ?, 'accepted', NOW())
            `, [groupId, bestMatch.user_id, Math.round(bestMatch.match_score)]);
            
            // Update match status for both users
            await db.promise().query(`
                UPDATE travel_preferences 
                SET match_status = 'matched' 
                WHERE user_id IN (?, ?)
            `, [user_id, bestMatch.user_id]);
            
            // Commit transaction
            await db.promise().query('COMMIT');
            
            console.log(`🎉 Group created successfully! Group ID: ${groupId}`);
            
            return {
                success: true,
                group_id: groupId,
                matched_with: bestMatch.user_id,
                matched_with_name: bestMatch.name,
                match_score: bestMatch.match_score,
                common_interests: bestMatch.common_interests,
                average_score: averageScore
            };
            
        } catch (error) {
            await db.promise().query('ROLLBACK');
            throw error;
        }
        
    } catch (error) {
        console.error('❌ Error creating group:', error);
        return null;
    }
}

// ============================================
// SAVE TRAVEL PREFERENCES (INSERT OR UPDATE)
// ============================================
router.post('/save', (req, res) => {
    console.log('='.repeat(60));
    console.log('📥 RECEIVED PREFERENCE SAVE REQUEST');
    console.log('='.repeat(60));
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    
    const {
        user_id,
        destination,
        start_date,
        end_date,
        duration_days,
        budget_min,
        budget_max,
        travelers_count,
        interests,
        companion_type,
        match_status = 'pending'  // Default value
    } = req.body;

    // Validate required fields
    if (!user_id) {
        console.log('❌ Missing user_id');
        return res.status(400).json({
            success: false,
            message: 'User ID is required'
        });
    }

    const clean_user_id = cleanUserId(user_id);

    // Check if user exists
    db.query('SELECT * FROM users WHERE user_id = ?', [clean_user_id], (userErr, userResults) => {
        if (userErr) {
            console.error('❌ Error checking user:', userErr);
            return res.status(500).json({
                success: false,
                message: 'Database error checking user',
                error: userErr.message
            });
        }

        if (userResults.length === 0) {
            console.log('❌ User not found:', clean_user_id);
            return res.status(404).json({
                success: false,
                message: 'User not found. Please sign up first.'
            });
        }

        console.log('✅ User found, proceeding to save preference');
        savePreference(clean_user_id);
    });

    function savePreference(validUserId) {
        // Format dates for database
        const formattedStartDate = formatDateForMySQL(start_date);
        const formattedEndDate = formatDateForMySQL(end_date);
        
        // Process interests for database storage
        const interestsJSON = processInterestsForDB(interests);
        
        // Process other fields
        const processedData = {
            user_id: validUserId,
            destination: destination || null,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            duration_days: duration_days ? parseInt(duration_days) : null,
            budget_min: budget_min ? parseInt(budget_min) : null,
            budget_max: budget_max ? parseInt(budget_max) : null,
            travelers_count: travelers_count ? parseInt(travelers_count) : null,
            companion_type: companion_type || null,
            match_status: match_status || 'pending'
        };

        console.log('\n📤 Final processed data:', {
            user_id: validUserId,
            ...processedData,
            interests: interestsJSON
        });

        // Check if user already has preferences
        const checkQuery = 'SELECT preference_id FROM travel_preferences WHERE user_id = ?';
        
        db.query(checkQuery, [validUserId], async (checkErr, checkResults) => {
            if (checkErr) {
                console.error('❌ Error checking existing preference:', checkErr);
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: checkErr.message
                });
            }

            let preferenceId = null;
            
            if (checkResults.length > 0) {
                // UPDATE existing preference
                preferenceId = checkResults[0].preference_id;
                console.log(`📝 Updating existing preference ID: ${preferenceId}`);

                const updateQuery = `
                    UPDATE travel_preferences 
                    SET destination = ?,
                        start_date = ?,
                        end_date = ?,
                        duration_days = ?,
                        budget_min = ?,
                        budget_max = ?,
                        travelers_count = ?,
                        interests = ?,
                        companion_type = ?,
                        match_status = ?,
                        created_at = NOW()
                    WHERE user_id = ?
                `;

                const updateValues = [
                    processedData.destination,
                    processedData.start_date,
                    processedData.end_date,
                    processedData.duration_days,
                    processedData.budget_min,
                    processedData.budget_max,
                    processedData.travelers_count,
                    interestsJSON,
                    processedData.companion_type,
                    processedData.match_status,
                    validUserId
                ];

                db.query(updateQuery, updateValues, async (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error('❌ Error updating preference:', updateErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to update preferences',
                            error: updateErr.message
                        });
                    }

                    console.log('✅ Preferences UPDATED successfully!');
                    
                    // After saving, try to find matches and create group
                    if (processedData.companion_type && 
                        processedData.companion_type !== 'null' &&
                        interestsJSON !== '[]' && 
                        interestsJSON !== 'null') {
                        
                        console.log('🔍 Checking for matches after preference update...');
                        
                        const groupResult = await findAndCreateGroups({
                            ...processedData,
                            interests: interestsJSON
                        });
                        
                        if (groupResult && groupResult.success) {
                            console.log('🎉 Group created successfully:', groupResult);
                            return res.json({
                                success: true,
                                message: 'Preferences updated and group created!',
                                preference_id: preferenceId,
                                action: 'updated',
                                group_created: true,
                                group_id: groupResult.group_id,
                                matched_with: groupResult.matched_with_name,
                                match_score: groupResult.match_score
                            });
                        } else if (groupResult === null) {
                            console.log('ℹ️ No suitable matches found yet');
                            return res.json({
                                success: true,
                                message: 'Preferences updated successfully. We\'ll notify you when we find a match!',
                                preference_id: preferenceId,
                                action: 'updated',
                                group_created: false,
                                searching: true
                            });
                        }
                    }
                    
                    res.json({
                        success: true,
                        message: 'Preferences updated successfully',
                        preference_id: preferenceId,
                        action: 'updated',
                        group_created: false
                    });
                });
            } else {
                // INSERT new preference
                const insertQuery = `
                    INSERT INTO travel_preferences 
                    (user_id, destination, start_date, end_date, duration_days, 
                     budget_min, budget_max, travelers_count, interests, companion_type, 
                     match_status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `;

                const insertValues = [
                    validUserId,
                    processedData.destination,
                    processedData.start_date,
                    processedData.end_date,
                    processedData.duration_days,
                    processedData.budget_min,
                    processedData.budget_max,
                    processedData.travelers_count,
                    interestsJSON,
                    processedData.companion_type,
                    processedData.match_status
                ];

                console.log('📝 Executing INSERT...');

                db.query(insertQuery, insertValues, async (insertErr, insertResult) => {
                    if (insertErr) {
                        console.error('❌ Error inserting preferences:', insertErr);
                        
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to save preferences',
                            error: insertErr.message,
                            sqlError: insertErr.code
                        });
                    }

                    console.log('✅ New preferences INSERTED successfully!');
                    console.log('📌 New preference ID:', insertResult.insertId);
                    
                    const newPreferenceId = insertResult.insertId;
                    
                    // After saving, try to find matches and create group
                    if (processedData.companion_type && 
                        processedData.companion_type !== 'null' &&
                        interestsJSON !== '[]' && 
                        interestsJSON !== 'null') {
                        
                        console.log('🔍 Checking for matches after preference creation...');
                        
                        const groupResult = await findAndCreateGroups({
                            ...processedData,
                            interests: interestsJSON
                        });
                        
                        if (groupResult && groupResult.success) {
                            console.log('🎉 Group created successfully:', groupResult);
                            return res.json({
                                success: true,
                                message: 'Preferences saved and group created!',
                                preference_id: newPreferenceId,
                                action: 'inserted',
                                group_created: true,
                                group_id: groupResult.group_id,
                                matched_with: groupResult.matched_with_name,
                                match_score: groupResult.match_score
                            });
                        } else if (groupResult === null) {
                            console.log('ℹ️ No suitable matches found yet');
                            return res.json({
                                success: true,
                                message: 'Preferences saved successfully. We\'ll notify you when we find a match!',
                                preference_id: newPreferenceId,
                                action: 'inserted',
                                group_created: false,
                                searching: true
                            });
                        }
                    }
                    
                    res.json({
                        success: true,
                        message: 'Preferences saved successfully',
                        preference_id: newPreferenceId,
                        action: 'inserted',
                        group_created: false
                    });
                });
            }
        });
    }
});

// ============================================
// GET USER PREFERENCES
// ============================================
router.get('/user/:user_id', (req, res) => {
    const { user_id } = req.params;
    const clean_user_id = cleanUserId(user_id);

    const query = `
        SELECT 
            preference_id,
            destination,
            DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
            DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
            duration_days,
            budget_min,
            budget_max,
            travelers_count,
            interests,
            companion_type,
            match_status,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
        FROM travel_preferences 
        WHERE user_id = ? 
        ORDER BY created_at DESC
        LIMIT 1
    `;

    db.query(query, [clean_user_id], (err, results) => {
        if (err) {
            console.error('Error fetching preferences:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (results.length === 0) {
            return res.json({
                success: true,
                hasPreferences: false,
                message: 'No preferences found'
            });
        }

        // Parse JSON interests back to array
        const preference = results[0];
        preference.interests = parseInterests(preference.interests);

        res.json({
            success: true,
            hasPreferences: true,
            preferences: preference
        });
    });
});

// ============================================
// GET ALL PREFERENCES WITH USER DETAILS (FOR MATCHING)
// ============================================
router.get('/all-with-users', (req, res) => {
    const query = `
        SELECT 
            tp.*,
            u.name as user_name,
            u.location as user_location,
            u.dob as user_dob,
            u.gender as user_gender,
            u.email as user_email
        FROM travel_preferences tp
        JOIN users u ON tp.user_id = u.user_id
        ORDER BY tp.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching preferences with users:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }
        
        // Parse JSON interests
        const parsed = results.map(row => ({
            ...row,
            interests: parseInterests(row.interests)
        }));
        
        res.json({
            success: true,
            count: parsed.length,
            data: parsed
        });
    });
});

// ============================================
// DEBUG: Get all preferences (limited)
// ============================================
router.get('/debug/all', (req, res) => {
    const query = 'SELECT * FROM travel_preferences ORDER BY preference_id DESC LIMIT 20';
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false,
                error: err.message 
            });
        }
        
        // Parse JSON fields properly
        const parsed = results.map(row => ({
            ...row,
            interests: parseInterests(row.interests)
        }));
        
        console.log(`✅ Debug endpoint returning ${parsed.length} records with parsed interests`);
        res.json({
            success: true,
            count: parsed.length,
            data: parsed
        });
    });
});

// ============================================
// FIX INTERESTS FORMAT - MAINTENANCE ENDPOINT
// ============================================
router.post('/fix-interests', (req, res) => {
    const query = 'SELECT preference_id, user_id, interests FROM travel_preferences';
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        
        let fixed = 0;
        let errors = 0;
        let total = results.length;
        
        console.log(`Found ${total} records to check`);
        
        // Process each record
        const promises = results.map(row => {
            return new Promise((resolve) => {
                if (row.interests) {
                    try {
                        const parsedInterests = parseInterests(row.interests);
                        const fixedInterests = JSON.stringify(parsedInterests);
                        
                        // Only update if the format changed
                        if (JSON.stringify(parsedInterests) !== JSON.stringify(row.interests)) {
                            const updateQuery = 'UPDATE travel_preferences SET interests = ? WHERE preference_id = ?';
                            db.query(updateQuery, [fixedInterests, row.preference_id], (updateErr) => {
                                if (!updateErr) {
                                    fixed++;
                                    console.log(`✅ Fixed interests for user ${row.user_id}`);
                                } else {
                                    errors++;
                                    console.log(`❌ Error updating user ${row.user_id}:`, updateErr);
                                }
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    } catch (e) {
                        console.error(`Error fixing interest for user ${row.user_id}:`, e);
                        errors++;
                        resolve();
                    }
                } else {
                    resolve();
                }
            });
        });
        
        Promise.all(promises).then(() => {
            console.log(`Fix completed: ${fixed} fixed, ${errors} errors out of ${total} total`);
            res.json({
                success: true,
                message: 'Interest fixing completed',
                total: total,
                fixed: fixed,
                errors: errors
            });
        });
    });
});

export default router;