// cleanup_users_duplicates.js
import db from './db.js';

console.log('🧹 Starting cleanup of duplicate user entries...');

// First, let's see all users to understand the data
const getAllUsers = 'SELECT user_id, name, email, created_at FROM users ORDER BY user_id';

db.query(getAllUsers, (err, allUsers) => {
    if (err) {
        console.error('❌ Error fetching users:', err);
        db.end();
        return;
    }
    
    console.log(`📊 Total users in database: ${allUsers.length}`);
    console.log('\nCurrent users:');
    allUsers.forEach(user => {
        console.log(`   - ID: ${user.user_id}, Name: ${user.name}, Email: ${user.email}`);
    });
    
    console.log('\n' + '='.repeat(50));
    
    // Find duplicates by email (email should be unique)
    const findDuplicates = `
        SELECT email, COUNT(*) as count, GROUP_CONCAT(user_id) as user_ids, GROUP_CONCAT(name) as names
        FROM users
        GROUP BY email
        HAVING count > 1
    `;
    
    db.query(findDuplicates, (dupErr, duplicates) => {
        if (dupErr) {
            console.error('❌ Error finding duplicates:', dupErr);
            db.end();
            return;
        }
        
        if (duplicates.length === 0) {
            console.log('✅ No duplicate users found by email!');
            
            // Also check for duplicate user_ids (less likely but possible)
            checkDuplicateIds();
            return;
        }
        
        console.log(`📊 Found ${duplicates.length} duplicate email groups:`);
        
        // Process each duplicate group
        let processed = 0;
        
        duplicates.forEach(dup => {
            console.log(`\n📧 Email: ${dup.email} (${dup.count} copies)`);
            console.log(`   User IDs: ${dup.user_ids}`);
            console.log(`   Names: ${dup.names}`);
            
            // Get user_ids as array
            const userIds = dup.user_ids.split(',').map(id => id.trim());
            
            // Keep the first user (lowest ID) and delete others
            const keepUserId = userIds[0];
            const deleteUserIds = userIds.slice(1);
            
            console.log(`   ✅ Keeping user ID: ${keepUserId}`);
            console.log(`   🗑️ Deleting user IDs: ${deleteUserIds.join(', ')}`);
            
            if (deleteUserIds.length === 0) {
                processed++;
                if (processed === duplicates.length) {
                    checkDuplicateIds();
                }
                return;
            }
            
            // Before deleting, check if these users have related data
            const placeholders = deleteUserIds.map(() => '?').join(',');
            
            // Check travel_preferences
            const checkPrefQuery = `SELECT * FROM travel_preferences WHERE user_id IN (${placeholders})`;
            db.query(checkPrefQuery, deleteUserIds, (prefErr, prefResults) => {
                if (prefErr) {
                    console.error('❌ Error checking preferences:', prefErr);
                } else if (prefResults.length > 0) {
                    console.log(`   ⚠️ Found ${prefResults.length} travel preferences to be deleted`);
                }
                
                // Check travel_group_members (through preferences)
                const checkMembersQuery = `
                    SELECT tgm.* FROM travel_group_members tgm
                    JOIN travel_preferences tp ON tgm.preference_id = tp.preference_id
                    WHERE tp.user_id IN (${placeholders})
                `;
                db.query(checkMembersQuery, deleteUserIds, (memberErr, memberResults) => {
                    if (memberErr) {
                        console.error('❌ Error checking members:', memberErr);
                    } else if (memberResults.length > 0) {
                        console.log(`   ⚠️ Found ${memberResults.length} group members to be deleted`);
                    }
                    
                    // Now delete the duplicate users
                    const deleteQuery = `DELETE FROM users WHERE user_id IN (${placeholders})`;
                    db.query(deleteQuery, deleteUserIds, (delErr, delResult) => {
                        if (delErr) {
                            console.error('❌ Error deleting users:', delErr);
                        } else {
                            console.log(`   ✅ Deleted ${delResult.affectedRows} duplicate users`);
                        }
                        
                        processed++;
                        if (processed === duplicates.length) {
                            checkDuplicateIds();
                        }
                    });
                });
            });
        });
    });
});

function checkDuplicateIds() {
    console.log('\n' + '='.repeat(50));
    console.log('🔍 Checking for duplicate user_ids...');
    
    const findIdDuplicates = `
        SELECT user_id, COUNT(*) as count
        FROM users
        GROUP BY user_id
        HAVING count > 1
    `;
    
    db.query(findIdDuplicates, (err, results) => {
        if (err) {
            console.error('❌ Error checking duplicate IDs:', err);
        } else if (results.length > 0) {
            console.log(`⚠️ Found ${results.length} duplicate user_ids!`);
            console.log(results);
        } else {
            console.log('✅ No duplicate user_ids found!');
        }
        
        // Show final user list
        finalUserList();
    });
}

function finalUserList() {
    console.log('\n' + '='.repeat(50));
    console.log('📋 Final user list after cleanup:');
    
    db.query('SELECT user_id, name, email FROM users ORDER BY user_id', (err, users) => {
        if (err) {
            console.error('❌ Error fetching final users:', err);
        } else {
            users.forEach(user => {
                console.log(`   - ID: ${user.user_id}, Name: ${user.name}, Email: ${user.email}`);
            });
            console.log(`\n✅ Total users after cleanup: ${users.length}`);
        }
        
        db.end();
    });
}