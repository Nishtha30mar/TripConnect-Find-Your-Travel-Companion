// cleanup_members_duplicates.js
import db from './db.js';

console.log('🧹 Starting cleanup of duplicate travel group members...');

// First, check for duplicates
const checkDuplicates = `
    SELECT 
        preference_id,
        member_name,
        age,
        relationship,
        COUNT(*) as count,
        GROUP_CONCAT(member_id) as member_ids,
        GROUP_CONCAT(created_at) as created_dates
    FROM travel_group_members
    GROUP BY preference_id, member_name, age, relationship
    HAVING count > 1
`;

db.query(checkDuplicates, (err, duplicates) => {
    if (err) {
        console.error('❌ Error checking duplicates:', err);
        db.end();
        return;
    }
    
    if (duplicates.length === 0) {
        console.log('✅ No duplicate members found!');
        db.end();
        return;
    }
    
    console.log(`📊 Found ${duplicates.length} sets of duplicate members:`);
    duplicates.forEach(dup => {
        console.log(`   - ${dup.member_name} (${dup.relationship}, ${dup.age}y) in preference ${dup.preference_id}: ${dup.count} copies`);
    });
    
    // Keep only the oldest entry (first created) and delete others
    const cleanupQuery = `
        DELETE t1 FROM travel_group_members t1
        INNER JOIN travel_group_members t2 
        WHERE 
            t1.member_id > t2.member_id
            AND t1.preference_id = t2.preference_id
            AND t1.member_name = t2.member_name
            AND t1.age = t2.age
            AND t1.relationship = t2.relationship
    `;
    
    db.query(cleanupQuery, (cleanErr, result) => {
        if (cleanErr) {
            console.error('❌ Error during cleanup:', cleanErr);
            db.end();
            return;
        }
        
        console.log(`✅ Cleanup complete! Removed ${result.affectedRows} duplicate entries.`);
        
        // Verify no duplicates remain
        db.query(checkDuplicates, (verifyErr, verifyResults) => {
            if (verifyErr) {
                console.error('❌ Error verifying cleanup:', verifyErr);
            } else if (verifyResults.length === 0) {
                console.log('✅ Verification: No duplicates remaining!');
            } else {
                console.log('⚠️ Warning: Some duplicates may still exist');
            }
            
            db.end();
        });
    });
}); 