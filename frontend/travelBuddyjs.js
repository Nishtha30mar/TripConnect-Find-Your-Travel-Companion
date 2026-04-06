// API endpoint
const API_BASE_URL = 'http://localhost:5000/api';

// Get user data from localStorage
const token = localStorage.getItem('token');
const loginUsername = localStorage.getItem('username');
const userEmail = localStorage.getItem('userEmail');

console.log('🔐 Login Info:');
console.log('  - Login username:', loginUsername);
console.log('  - User email:', userEmail);

// Redirect to login if not authenticated
if (!token || !loginUsername) {
    window.location.href = 'index.html';
}

// Current user data - will be populated after we find the correct user
let currentUser = null;
let selectedGroup = null;
let groupFormed = false;
let currentGroupId = null;
let currentGroupDates = null;
let activeGroups = [];

// DOM Elements
const findBuddiesBtn = document.getElementById('findBuddiesBtn');
const matchesContainer = document.getElementById('matchesContainer');
const noMatchesMessage = document.getElementById('noMatchesMessage');
const groupModal = document.getElementById('groupModal');
const modalMatchScore = document.getElementById('modalMatchScore');
const modalGroupSize = document.getElementById('modalGroupSize');
const modalCommonInterests = document.getElementById('modalCommonInterests');
const modalDestination = document.getElementById('modalDestination');
const modalDates = document.getElementById('modalDates');
const modalMembers = document.getElementById('modalMembers');
const rejectGroupBtn = document.getElementById('rejectGroupBtn');
const acceptGroupBtn = document.getElementById('acceptGroupBtn');
const userProfileName = document.querySelector('.profile-name');
const userProfilePic = document.querySelector('.profile-pic');
const profileInterests = document.querySelector('.profile-interests');
const profileLocation = document.querySelector('.profile-location');

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ DOM loaded');
    
    if (noMatchesMessage) {
        noMatchesMessage.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading your preferences...';
    }
    
    await findUserInDatabase();
    
    if (currentUser) {
        updateUserProfileUI();
        await checkAllActiveGroups();
        setupFindBuddiesButton();
        setupModalButtons();
        
        if (noMatchesMessage) {
            noMatchesMessage.style.display = 'none';
        }
    }
});

// ==================== DATE HELPER FUNCTIONS ====================

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

function calculateAverageDates(users) {
    if (!users || users.length === 0) return { startDate: null, endDate: null, duration: 0 };
    
    let totalStartTimestamp = 0;
    let totalEndTimestamp = 0;
    let validStartDates = 0;
    let validEndDates = 0;
    
    users.forEach(user => {
        if (user.startDate) {
            totalStartTimestamp += new Date(user.startDate).getTime();
            validStartDates++;
        }
        if (user.endDate) {
            totalEndTimestamp += new Date(user.endDate).getTime();
            validEndDates++;
        }
    });
    
    const avgStartDate = validStartDates > 0 ? new Date(totalStartTimestamp / validStartDates) : null;
    const avgEndDate = validEndDates > 0 ? new Date(totalEndTimestamp / validEndDates) : null;
    
    let duration = 7;
    if (avgStartDate && avgEndDate) {
        const diffTime = Math.abs(avgEndDate - avgStartDate);
        duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    return {
        startDate: avgStartDate ? avgStartDate.toISOString().split('T')[0] : null,
        endDate: avgEndDate ? avgEndDate.toISOString().split('T')[0] : null,
        duration: duration
    };
}

function findCommonOverlap(groupMembers) {
    if (!groupMembers || groupMembers.length === 0) return null;
    
    let commonStart = groupMembers[0].startDate ? new Date(groupMembers[0].startDate) : null;
    let commonEnd = groupMembers[0].endDate ? new Date(groupMembers[0].endDate) : null;
    
    if (!commonStart || !commonEnd) return null;
    
    for (let i = 1; i < groupMembers.length; i++) {
        const member = groupMembers[i];
        if (!member.startDate || !member.endDate) return null;
        
        const memberStart = new Date(member.startDate);
        const memberEnd = new Date(member.endDate);
        
        commonStart = new Date(Math.max(commonStart, memberStart));
        commonEnd = new Date(Math.min(commonEnd, memberEnd));
        
        if (commonStart > commonEnd) return null;
    }
    
    const duration = Math.ceil((commonEnd - commonStart) / (1000 * 60 * 60 * 24));
    
    return {
        startDate: commonStart.toISOString().split('T')[0],
        endDate: commonEnd.toISOString().split('T')[0],
        duration: duration
    };
}

function calculateWeightedMatchScore(currentUser, buddy, interestMatchScore) {
    let dateCompatibilityScore = 0;
    
    if (currentUser.startDate && currentUser.endDate && buddy.startDate && buddy.endDate) {
        const overlapDays = getOverlapDays(
            currentUser.startDate, currentUser.endDate,
            buddy.startDate, buddy.endDate
        );
        
        const currentUserDuration = getDurationInDays(currentUser.startDate, currentUser.endDate);
        const maxDuration = Math.max(currentUserDuration, getDurationInDays(buddy.startDate, buddy.endDate));
        
        if (maxDuration > 0) {
            dateCompatibilityScore = (overlapDays / maxDuration) * 100;
        }
    } else if (currentUser.startDate && currentUser.endDate) {
        dateCompatibilityScore = 50;
    } else {
        dateCompatibilityScore = 0;
    }
    
    const weightedScore = Math.round((interestMatchScore * 0.7) + (dateCompatibilityScore * 0.3));
    return Math.min(100, Math.max(0, weightedScore));
}

// ==================== DATE CONFLICT CHECKING ====================

// Helper function to check if a user has any active group that overlaps with given dates
async function checkUserDateConflict(userId, startDate, endDate) {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/user/${userId}/active`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.has_active_group && data.data) {
            const existingGroup = data.data.group;
            
            // Check if dates overlap
            const hasOverlap = datesOverlap(
                startDate, endDate,
                existingGroup.start_date, existingGroup.end_date
            );
            
            if (hasOverlap) {
                console.log(`⚠️ User ${userId} already has active group ${existingGroup.group_id} during ${existingGroup.start_date} to ${existingGroup.end_date}`);
                return true;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error(`Error checking date conflict for user ${userId}:`, error);
        return false; // Assume no conflict on error
    }
}

// Check if any member in a group has date conflicts
async function checkGroupMembersDateConflicts(members, proposedStartDate, proposedEndDate) {
    for (const member of members) {
        const hasConflict = await checkUserDateConflict(member.user_id, proposedStartDate, proposedEndDate);
        if (hasConflict) {
            console.log(`❌ Member ${member.user_id} has conflicting active group`);
            return true;
        }
    }
    return false;
}

// ==================== GROUP MANAGEMENT ====================

async function checkAllActiveGroups() {
    try {
        console.log('🔍 Checking all active groups for user...');
        
        const response = await fetch(`${API_BASE_URL}/groups/user/all-active`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.groups && data.groups.length > 0) {
            console.log(`✅ Found ${data.groups.length} active group(s):`, data.groups);
            activeGroups = data.groups;
            groupFormed = true;
            
            const mostRecentGroup = data.groups[0];
            currentGroupId = mostRecentGroup.group_id;
            currentGroupDates = {
                startDate: mostRecentGroup.start_date,
                endDate: mostRecentGroup.end_date
            };
            
            showAllActiveGroups(data.groups);
        } else {
            console.log('ℹ️ No active groups found');
            groupFormed = false;
            activeGroups = [];
        }
    } catch (error) {
        console.error('Error checking active groups:', error);
        groupFormed = false;
        activeGroups = [];
    }
}

function showAllActiveGroups(groups) {
    if (!matchesContainer) return;
    
    if (groups.length === 1) {
        showExistingGroup(groups[0]);
    } else {
        matchesContainer.innerHTML = `
            <div class="active-groups-container">
                <h3><i class="fas fa-suitcase-rolling"></i> Your Active Trips (${groups.length})</h3>
                <p>You are currently part of ${groups.length} active trip(s). Click on any trip to view details.</p>
                <div class="groups-list" style="margin-top: 20px;">
                    ${groups.map(group => `
                        <div class="group-card" style="background: rgba(255,255,255,0.15); border-radius: 10px; padding: 15px; margin-bottom: 15px; cursor: pointer;" onclick="showGroupDetails('${group.group_id}')">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h4 style="margin: 0 0 5px 0;">${group.destination}</h4>
                                    <p style="margin: 0; font-size: 0.9rem;"><i class="fas fa-calendar-alt"></i> ${group.start_date} to ${group.end_date}</p>
                                    <p style="margin: 5px 0 0 0; font-size: 0.9rem;"><i class="fas fa-users"></i> ${group.members_count} members | ${group.average_match_score}% match</p>
                                </div>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
               
            </div>
        `;
        matchesContainer.style.display = 'block';
        if (noMatchesMessage) noMatchesMessage.style.display = 'none';
    }
}

function showExistingGroup(groupData) {
    if (!matchesContainer) return;
    
    const group = groupData.group || groupData;
    const members = groupData.members || [];
    
    const currentUserMember = members.find(m => m.user_id === currentUser.userId);
    const matchScore = currentUserMember ? currentUserMember.match_score : group.average_match_score;
    
    const itineraryData = {
        destination: group.destination,
        startDate: group.start_date,
        endDate: group.end_date,
        duration: calculateDuration(group.start_date, group.end_date),
        interests: currentUser.interests,
        groupMembers: members.map(m => ({
            name: m.name,
            initials: getInitials(m.name)
        })),
        matchScore: matchScore,
        groupSize: members.length,
        groupId: group.group_id
    };
    
    sessionStorage.setItem('itineraryData', JSON.stringify(itineraryData));
    
    matchesContainer.innerHTML = `
        <div class="group-success-card" style="position: relative;">
            <button class="leave-group-btn" id="leaveGroupBtn" style="position: absolute; top: 20px; right: 20px; background: rgba(231, 76, 60, 0.2); border: 1px solid #e74c3c; color: #e74c3c; padding: 8px 15px; border-radius: 20px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 5px;">
                <i class="fas fa-sign-out-alt"></i> Leave Group
            </button>
            
            <i class="fas fa-check-circle group-success-icon" style="font-size: 4rem; color: #2ecc71; margin-bottom: 20px;"></i>
            <h3>Your Active Trip!</h3>
            <p>You're currently traveling to ${group.destination} with ${members.length} members. Match score: ${group.average_match_score}%</p>
            
            <div class="group-stats" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 25px 0; padding: 20px; background-color: rgba(255, 255, 255, 0.2); border-radius: 10px;">
                <div class="group-stat-item" style="text-align: center;">
                    <div class="group-stat-value" style="font-size: 1.3rem; font-weight: 600; margin-bottom: 5px;">${members.length}</div>
                    <div class="group-stat-label" style="font-size: 0.9rem; opacity: 0.9;">Members</div>
                </div>
                <div class="group-stat-item" style="text-align: center;">
                    <div class="group-stat-value" style="font-size: 1.3rem; font-weight: 600; margin-bottom: 5px;">${group.average_match_score}%</div>
                    <div class="group-stat-label" style="font-size: 0.9rem; opacity: 0.9;">Match Score</div>
                </div>
                <div class="group-stat-item" style="text-align: center;">
                    <div class="group-stat-value" style="font-size: 1.3rem; font-weight: 600; margin-bottom: 5px;">${group.common_interests_count}</div>
                    <div class="group-stat-label" style="font-size: 0.9rem; opacity: 0.9;">Common Interests</div>
                </div>
                <div class="group-stat-item" style="text-align: center;">
                    <div class="group-stat-value" style="font-size: 1.3rem; font-weight: 600; margin-bottom: 5px;">${group.destination}</div>
                    <div class="group-stat-label" style="font-size: 0.9rem; opacity: 0.9;">Destination</div>
                </div>
            </div>
            
            <div class="group-members-display" style="display: flex; justify-content: center; gap: 15px; margin: 25px 0; flex-wrap: wrap;">
                ${members.map(member => `
                    <div class="group-member-small" style="text-align: center;">
                        <div class="member-avatar-small" style="width: 50px; height: 50px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; color: #2ecc71; font-size: 1rem; font-weight: 600; margin: 0 auto 8px;">${getInitials(member.name)}</div>
                        <div class="member-name-small" style="font-size: 0.8rem; font-weight: 500;">${member.name.split(' ')[0]}</div>
                        ${member.user_id === currentUser.userId ? '<div style="font-size: 0.7rem; color: #ffd966;">(You)</div>' : ''}
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-top: 30px;">
                <button onclick="window.location.href='itinerary.html'" class="custom-trip-link" id="customTripBtn" style="display: inline-block; width: 100%; padding: 15px; background: linear-gradient(135deg, #3498db, #2ecc71); color: white; border-radius: 10px; text-decoration: none; font-weight: 600; text-align: center; border: none; cursor: pointer;">
                    <i class="fas fa-map-marked-alt"></i> View Trip Itinerary
                </button>
            </div>
        </div>
    `;
    
    matchesContainer.style.display = 'block';
    if (noMatchesMessage) noMatchesMessage.style.display = 'none';
    
    const leaveGroupBtn = document.getElementById('leaveGroupBtn');
    if (leaveGroupBtn) {
        leaveGroupBtn.addEventListener('click', async function() {
            if (confirm('Are you sure you want to leave this group?')) {
                await leaveGroup(currentGroupId);
            }
        });
    }
}

window.showGroupDetails = async function(groupId) {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            currentGroupId = groupId;
            currentGroupDates = {
                startDate: data.data.group.start_date,
                endDate: data.data.group.end_date
            };
            showExistingGroup(data.data);
        }
    } catch (error) {
        console.error('Error fetching group details:', error);
    }
};

// ==================== FIND EXISTING GROUPS ====================

async function findGroup() {
    console.log('🔍 Looking for existing groups with compatible dates...');
    
    // Check if user already has active groups
    if (activeGroups.length > 0) {
        showNoMatchesMessage(`You already have ${activeGroups.length} active trip(s). Please leave your current group(s) before joining a new one.`);
        return;
    }
    
    try {
        // STEP 1: Fetch all existing groups from database
        const groupsResponse = await fetch(`${API_BASE_URL}/groups/all`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        
        const groupsData = await groupsResponse.json();
        const allGroups = groupsData.data || [];
        
        console.log(`📋 Found ${allGroups.length} existing groups in database`);
        
        // STEP 2: Find groups that match user's destination and have date overlap
        const compatibleGroups = [];
        
        for (const group of allGroups) {
            // Check if destination matches
            if (group.destination.toLowerCase() !== currentUser.destination.toLowerCase()) {
                continue;
            }
            
            // Check if dates overlap
            if (!datesOverlap(currentUser.startDate, currentUser.endDate, group.start_date, group.end_date)) {
                continue;
            }
            
            // Check if user is already in this group
            const isUserInGroup = group.members?.some(m => m.user_id === currentUser.userId);
            if (isUserInGroup) {
                console.log(`User already in group ${group.group_id}, skipping`);
                continue;
            }
            
            // Check if group has capacity (max 10 members)
            const currentMemberCount = group.members?.length || 0;
            if (currentMemberCount >= 10) {
                console.log(`Group ${group.group_id} is full (${currentMemberCount}/10), skipping`);
                continue;
            }
            
            // ✅ NEW: Check if any existing group members have overlapping active groups
            const hasDateConflict = await checkGroupMembersDateConflicts(
                group.members || [],
                group.start_date,
                group.end_date
            );
            
            if (hasDateConflict) {
                console.log(`Skipping group ${group.group_id} due to member date conflicts`);
                continue;
            }
            
            // Calculate match score with existing group members
            const groupMembers = group.members || [];
            const matchScores = [];
            
            for (const member of groupMembers) {
                // Fetch member's preferences to get interests
                const memberPrefResponse = await fetch(`${API_BASE_URL}/preferences/${member.user_id}`, {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : ''
                    }
                });
                const memberPrefData = await memberPrefResponse.json();
                const memberPref = memberPrefData.data;
                
                if (memberPref && memberPref.interests) {
                    let memberInterests = [];
                    if (Array.isArray(memberPref.interests)) {
                        memberInterests = memberPref.interests;
                    } else if (typeof memberPref.interests === 'string') {
                        try {
                            memberInterests = JSON.parse(memberPref.interests);
                        } catch (e) {
                            memberInterests = memberPref.interests.split(',').map(i => i.trim());
                        }
                    }
                    
                    // Calculate interest match
                    const commonInterests = currentUser.interests.filter(interest =>
                        memberInterests.some(mi => mi.toLowerCase() === interest.toLowerCase())
                    );
                    
                    const interestMatch = Math.round((commonInterests.length / currentUser.interests.length) * 100);
                    
                    // Calculate weighted score with date compatibility
                    const memberUser = {
                        startDate: memberPref.start_date,
                        endDate: memberPref.end_date
                    };
                    
                    const weightedScore = calculateWeightedMatchScore(currentUser, memberUser, interestMatch);
                    matchScores.push(weightedScore);
                }
            }
            
            // Calculate average match score with group
            const avgMatchScore = matchScores.length > 0 
                ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length)
                : 0;
            
            // Only consider groups with at least 40% average match
            if (avgMatchScore >= 40) {
                compatibleGroups.push({
                    group: group,
                    avgMatchScore: avgMatchScore,
                    memberCount: currentMemberCount,
                    matchScores: matchScores
                });
            }
        }
        
        // Sort by match score (highest first)
        compatibleGroups.sort((a, b) => b.avgMatchScore - a.avgMatchScore);
        
        console.log(`✅ Found ${compatibleGroups.length} compatible existing groups`);
        
        if (compatibleGroups.length > 0) {
            // Show the best matching existing group
            const bestGroup = compatibleGroups[0];
            console.log('Best matching group:', bestGroup.group.group_id, 'Match:', bestGroup.avgMatchScore);
            
            // Fetch full group details with members
            const groupDetailsResponse = await fetch(`${API_BASE_URL}/groups/${bestGroup.group.group_id}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            const groupDetails = await groupDetailsResponse.json();
            
            if (groupDetails.success && groupDetails.data) {
                // Show invitation to join existing group
                showExistingGroupInvitation(groupDetails.data, bestGroup.avgMatchScore);
                return;
            }
        }
        
        // STEP 3: If no compatible existing group found, create a new group
        console.log('No compatible existing groups found, creating new group...');
        await createNewGroup();
        
    } catch (error) {
        console.error('Error finding groups:', error);
        showNoMatchesMessage('Error finding groups: ' + error.message);
    }
}

// Show invitation to join existing group
function showExistingGroupInvitation(groupData, matchScore) {
    if (!groupModal) return;
    
    const group = groupData.group;
    const members = groupData.members || [];
    
    modalMatchScore.textContent = matchScore + '%';
    modalGroupSize.textContent = members.length;
    modalCommonInterests.textContent = group.common_interests_count;
    modalDestination.textContent = group.destination;
    modalDates.textContent = `${group.start_date} to ${group.end_date}`;
    
    modalMembers.innerHTML = '';
    
    // Show existing members
    members.forEach(member => {
        addMemberToModal(
            getInitials(member.name),
            member.name + (member.user_id === currentUser.userId ? ' (You)' : '')
        );
    });
    
    // Add current user as pending
    addMemberToModal(
        currentUser.initials,
        currentUser.name + ' (You - Joining)'
    );
    
    // Store selected group data
    selectedGroup = {
        existingGroup: true,
        groupId: group.group_id,
        group: group,
        members: members,
        matchScore: matchScore
    };
    
    groupModal.style.display = 'flex';
}

// Create new group
async function createNewGroup() {
    console.log('🆕 Creating new group for:', currentUser);
    
    // Fetch all users
    const response = await fetch(`${API_BASE_URL}/preferences/debug/all`, {
        headers: {
            'Authorization': token ? `Bearer ${token}` : ''
        }
    });
    
    const data = await response.json();
    const allUsers = data.data || [];
    
    // ✅ IMPROVED: Check for date conflicts for all potential buddies
    const availableUsers = [];
    
    for (const user of allUsers) {
        if (user.user_id !== currentUser.userId) {
            // First check if user has overlapping active groups
            const hasOverlapConflict = await checkUserDateConflict(
                user.user_id,
                currentUser.startDate,
                currentUser.endDate
            );
            
            if (hasOverlapConflict) {
                console.log(`❌ User ${user.user_id} has conflicting active group, excluding from group formation`);
                continue;
            }
            
            availableUsers.push(user);
        }
    }
    
    // Filter for buddy users with same destination AND date overlap AND no date conflicts
    const potentialBuddies = availableUsers.filter(u => 
        u.user_id !== currentUser.userId &&
        u.companion_type === 'buddy' &&
        u.destination && 
        u.destination.toLowerCase() === currentUser.destination.toLowerCase() &&
        datesOverlap(currentUser.startDate, currentUser.endDate, u.start_date, u.end_date)
    );
    
    console.log(`Found ${potentialBuddies.length} potential buddies for new group after filtering conflicts`);
    
    if (potentialBuddies.length < 2) {
        showNoMatchesMessage(`Need at least 2 buddies with overlapping dates and no schedule conflicts. Found: ${potentialBuddies.length}`);
        return;
    }
    
    // Parse interests and dates for each buddy
    const buddies = potentialBuddies.map(buddy => {
        let interests = [];
        if (buddy.interests) {
            if (Array.isArray(buddy.interests)) {
                interests = buddy.interests;
            } else if (typeof buddy.interests === 'string') {
                try {
                    interests = JSON.parse(buddy.interests);
                } catch (e) {
                    interests = buddy.interests.split(',').map(i => i.trim());
                }
            }
        }
        
        const nameParts = buddy.user_id.split('_');
        const formattedName = nameParts
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        
        return {
            userId: buddy.user_id,
            name: formattedName,
            initials: getInitials(formattedName),
            interests: interests,
            destination: buddy.destination,
            startDate: buddy.start_date,
            endDate: buddy.end_date,
            budgetMin: buddy.budget_min || 0,
            budgetMax: buddy.budget_max || 0,
            travelersCount: buddy.travelers_count || 0
        };
    });
    
    // Calculate weighted matches
    const matches = buddies.map(buddy => {
        const commonInterests = currentUser.interests.filter(interest => 
            buddy.interests.some(bi => bi.toLowerCase() === interest.toLowerCase())
        );
        
        const interestMatchScore = Math.round((commonInterests.length / currentUser.interests.length) * 100);
        const weightedScore = calculateWeightedMatchScore(currentUser, buddy, interestMatchScore);
        
        return {
            user: buddy,
            score: weightedScore,
            common: commonInterests,
            overlapDays: getOverlapDays(currentUser.startDate, currentUser.endDate, buddy.startDate, buddy.endDate),
            interestMatch: interestMatchScore
        };
    }).filter(m => m.score >= 40)
      .sort((a, b) => b.score - a.score);
    
    if (matches.length < 2) {
        showNoMatchesMessage(`Need at least 2 buddies with ≥40% match and no schedule conflicts. Found: ${matches.length}`);
        return;
    }
    
    const maxGroupSize = 10;
    const topMatches = matches.slice(0, maxGroupSize - 1);
    const groupMembers = [currentUser, ...topMatches.map(m => m.user)];
    
    const averageDates = calculateAverageDates(groupMembers);
    const commonOverlap = findCommonOverlap(groupMembers);
    
    const avgScore = Math.round(([100, ...topMatches.map(m => m.score)].reduce((sum, s) => sum + s, 0)) / groupMembers.length);
    
    const allInterests = groupMembers.flatMap(m => m.interests);
    const interestCounts = {};
    allInterests.forEach(i => {
        interestCounts[i.toLowerCase()] = (interestCounts[i.toLowerCase()] || 0) + 1;
    });
    
    const commonAcrossGroup = Object.keys(interestCounts)
        .filter(i => interestCounts[i] >= Math.ceil(groupMembers.length / 2)).length;
    
    const group = {
        members: groupMembers,
        averageMatchScore: avgScore,
        commonInterestsCount: commonAcrossGroup,
        size: groupMembers.length,
        matchDetails: topMatches,
        averageDates: averageDates,
        commonOverlap: commonOverlap,
        existingGroup: false
    };
    
    console.log('✅ New group formed:', group);
    selectedGroup = group;
    showNewGroupInvitation(group);
}

function showNewGroupInvitation(group) {
    if (!groupModal) return;
    
    modalMatchScore.textContent = group.averageMatchScore + '%';
    modalGroupSize.textContent = group.size;
    modalCommonInterests.textContent = group.commonInterestsCount;
    modalDestination.textContent = currentUser.destination;
    
    let datesText = '';
    if (group.commonOverlap && group.commonOverlap.startDate && group.commonOverlap.endDate) {
        datesText = `📅 Common Overlap: ${group.commonOverlap.startDate} to ${group.commonOverlap.endDate} (${group.commonOverlap.duration} days)`;
    } else if (group.averageDates.startDate && group.averageDates.endDate) {
        datesText = `📅 Average Dates: ${group.averageDates.startDate} to ${group.averageDates.endDate} (${group.averageDates.duration} days)`;
    } else if (currentUser.startDate && currentUser.endDate) {
        datesText = `${currentUser.startDate} to ${currentUser.endDate}`;
    } else {
        datesText = 'Flexible dates';
    }
    
    modalDates.textContent = datesText;
    
    modalMembers.innerHTML = '';
    addMemberToModal(currentUser.initials, currentUser.name + ' (You)');
    
    group.members.forEach(member => {
        if (member.userId !== currentUser.userId) {
            const match = group.matchDetails.find(m => m.user.userId === member.userId);
            const overlapInfo = match ? ` | ${match.overlapDays} days overlap` : '';
            addMemberToModal(
                member.initials,
                member.name + ` (${match ? match.score : 0}% match${overlapInfo})`
            );
        }
    });
    
    groupModal.style.display = 'flex';
}

function addMemberToModal(initials, name) {
    const div = document.createElement('div');
    div.className = 'group-member';
    div.innerHTML = `<div class="member-avatar">${initials}</div><div class="member-name">${name}</div>`;
    modalMembers.appendChild(div);
}

function showNoMatchesMessage(message) {
    if (noMatchesMessage) {
        noMatchesMessage.style.display = 'block';
        noMatchesMessage.innerHTML = `
            <i class="fas fa-search"></i>
            <h3>No Compatible Groups Found</h3>
            <p>${message}</p>
            <p style="font-size:0.9rem; margin-top:10px; color:#666;">
                Your Destination: ${currentUser?.destination || 'Not set'}<br>
                Your Travel Dates: ${currentUser?.startDate || 'Not set'} to ${currentUser?.endDate || 'Not set'}<br>
                Your Interests: ${currentUser?.interests?.join(', ') || 'None'}
            </p>
        `;
    }
    if (matchesContainer) {
        matchesContainer.style.display = 'none';
    }
}

async function saveGroupToDatabase(group) {
    try {
        console.log('💾 Saving group to database...');
        
        // If this is joining an existing group
        if (group.existingGroup) {
            // ✅ Check for date conflicts before joining
            const hasConflict = await checkUserDateConflict(
                currentUser.userId,
                group.group.start_date,
                group.group.end_date
            );
            
            if (hasConflict) {
                throw new Error('You already have an active trip during these dates. Please leave your current group first.');
            }
            
            const response = await fetch(`${API_BASE_URL}/groups/${group.groupId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    user_id: currentUser.userId,
                    match_score: group.matchScore
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Joined existing group successfully:', data);
                currentGroupId = group.groupId;
                currentGroupDates = {
                    startDate: group.group.start_date,
                    endDate: group.group.end_date
                };
                await checkAllActiveGroups();
                return true;
            } else {
                console.error('❌ Failed to join group:', data.message);
                throw new Error(data.message);
            }
        }
        
        // Create new group
        let finalStartDate = group.commonOverlap?.startDate || group.averageDates?.startDate || currentUser.startDate;
        let finalEndDate = group.commonOverlap?.endDate || group.averageDates?.endDate || currentUser.endDate;
        
        const membersData = group.members.map(member => {
            let matchScore = 0;
            if (member.userId === currentUser.userId) {
                matchScore = 100;
            } else {
                const match = group.matchDetails.find(m => m.user.userId === member.userId);
                matchScore = match ? match.score : 0;
            }
            return {
                user_id: member.userId,
                match_score: matchScore
            };
        });
        
        const requestBody = {
            destination: currentUser.destination,
            start_date: finalStartDate,
            end_date: finalEndDate,
            average_match_score: group.averageMatchScore,
            common_interests_count: group.commonInterestsCount,
            members: membersData
        };
        
        const response = await fetch(`${API_BASE_URL}/groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ New group created successfully:', data);
            currentGroupId = data.group_id;
            currentGroupDates = {
                startDate: finalStartDate,
                endDate: finalEndDate
            };
            await checkAllActiveGroups();
            return true;
        } else {
            console.error('❌ Failed to create group:', data.message);
            throw new Error(data.message);
        }
        
    } catch (error) {
        console.error('Error saving group:', error);
        alert(error.message || 'Error saving group. Please try again.');
        return false;
    }
}

async function leaveGroup(groupId) {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/leave`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Left group successfully');
            await checkAllActiveGroups();
            sessionStorage.removeItem('itineraryData');
            
            if (activeGroups.length === 0) {
                groupFormed = false;
                selectedGroup = null;
                currentGroupId = null;
                currentGroupDates = null;
                
                if (matchesContainer) {
                    matchesContainer.innerHTML = '';
                    matchesContainer.style.display = 'none';
                }
                
                if (noMatchesMessage) {
                    noMatchesMessage.style.display = 'block';
                    noMatchesMessage.innerHTML = `
                        <i class="fas fa-search"></i>
                        <h3>No active trips</h3>
                        <p>Click "Find Your Travel Group" to find travel companions!</p>
                    `;
                }
            }
            
            alert('You have left the group.');
            return true;
        } else {
            console.error('Failed to leave group:', data.message);
            alert('Failed to leave group: ' + data.message);
            return false;
        }
        
    } catch (error) {
        console.error('Error leaving group:', error);
        alert('Error leaving group: ' + error.message);
        return false;
    }
}

function setupModalButtons() {
    acceptGroupBtn.addEventListener('click', async function() {
        const originalText = acceptGroupBtn.innerHTML;
        acceptGroupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
        acceptGroupBtn.disabled = true;
        
        try {
            const saved = await saveGroupToDatabase(selectedGroup);
            
            if (saved) {
                setTimeout(() => {
                    alert('Successfully joined the group!');
                    groupModal.style.display = 'none';
                    groupFormed = true;
                    
                    if (selectedGroup.existingGroup) {
                        // Show the existing group details
                        showGroupDetails(selectedGroup.groupId);
                    } else {
                        showGroupSuccess(selectedGroup);
                    }
                    
                    acceptGroupBtn.innerHTML = originalText;
                    acceptGroupBtn.disabled = false;
                }, 500);
            } else {
                throw new Error('Failed to join group');
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error joining group: ' + error.message);
            acceptGroupBtn.innerHTML = originalText;
            acceptGroupBtn.disabled = false;
        }
    });
    
    rejectGroupBtn.addEventListener('click', function() {
        if (confirm('Reject this group invitation?')) {
            groupModal.style.display = 'none';
        }
    });
}

function calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return 7;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 7;
}

function showGroupSuccess(group) {
    if (!matchesContainer) return;
    
    const finalStartDate = group.commonOverlap?.startDate || group.averageDates?.startDate || currentUser.startDate;
    const finalEndDate = group.commonOverlap?.endDate || group.averageDates?.endDate || currentUser.endDate;
    const duration = calculateDuration(finalStartDate, finalEndDate);
    
    const itineraryData = {
        destination: currentUser.destination,
        startDate: finalStartDate,
        endDate: finalEndDate,
        duration: duration,
        interests: currentUser.interests,
        groupMembers: group.members.map(m => ({
            name: m.name,
            initials: m.initials,
            userId: m.userId
        })),
        matchScore: group.averageMatchScore,
        groupSize: group.size,
        groupId: currentGroupId,
        dateType: group.commonOverlap ? 'common_overlap' : 'average'
    };
    
    sessionStorage.setItem('itineraryData', JSON.stringify(itineraryData));
    
    const dateInfo = group.commonOverlap ? 
        `All members can travel together from ${finalStartDate} to ${finalEndDate} (${duration} days)!` :
        `Based on average dates, your group will travel from ${finalStartDate} to ${finalEndDate} (${duration} days).`;
    
    matchesContainer.innerHTML = `
        <div class="group-success-card" style="position: relative;">
            <button class="leave-group-btn" id="leaveGroupBtn" style="position: absolute; top: 20px; right: 20px; background: rgba(231, 76, 60, 0.2); border: 1px solid #e74c3c; color: #e74c3c; padding: 8px 15px; border-radius: 20px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 5px;">
                <i class="fas fa-sign-out-alt"></i> Leave Group
            </button>
            
            <i class="fas fa-check-circle group-success-icon" style="font-size: 4rem; color: #2ecc71; margin-bottom: 20px;"></i>
            <h3>Group Successfully Formed!</h3>
            <p>Your travel group is ready with ${group.size} members. Average match score: ${group.averageMatchScore}%</p>
            <p style="margin-top: 10px; padding: 10px; background: rgba(52, 152, 219, 0.2); border-radius: 8px;">
                <i class="fas fa-calendar-alt"></i> ${dateInfo}
            </p>
            
            <div class="group-stats" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 25px 0; padding: 20px; background-color: rgba(255, 255, 255, 0.2); border-radius: 10px;">
                <div class="group-stat-item" style="text-align: center;">
                    <div class="group-stat-value" style="font-size: 1.3rem; font-weight: 600; margin-bottom: 5px;">${group.size}</div>
                    <div class="group-stat-label" style="font-size: 0.9rem; opacity: 0.9;">Members</div>
                </div>
                <div class="group-stat-item" style="text-align: center;">
                    <div class="group-stat-value" style="font-size: 1.3rem; font-weight: 600; margin-bottom: 5px;">${group.averageMatchScore}%</div>
                    <div class="group-stat-label" style="font-size: 0.9rem; opacity: 0.9;">Match Score</div>
                </div>
                <div class="group-stat-item" style="text-align: center;">
                    <div class="group-stat-value" style="font-size: 1.3rem; font-weight: 600; margin-bottom: 5px;">${group.commonInterestsCount}</div>
                    <div class="group-stat-label" style="font-size: 0.9rem; opacity: 0.9;">Common Interests</div>
                </div>
                <div class="group-stat-item" style="text-align: center;">
                    <div class="group-stat-value" style="font-size: 1.3rem; font-weight: 600; margin-bottom: 5px;">${duration}</div>
                    <div class="group-stat-label" style="font-size: 0.9rem; opacity: 0.9;">Trip Duration (Days)</div>
                </div>
            </div>
            
            <div class="group-members-display" style="display: flex; justify-content: center; gap: 15px; margin: 25px 0; flex-wrap: wrap;">
                ${group.members.map(member => {
                    const match = group.matchDetails?.find(m => m.user.userId === member.userId);
                    const matchDisplay = member.userId === currentUser.userId ? '' : ` (${match?.score || 0}%)`;
                    return `
                    <div class="group-member-small" style="text-align: center;">
                        <div class="member-avatar-small" style="width: 50px; height: 50px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; color: #2ecc71; font-size: 1rem; font-weight: 600; margin: 0 auto 8px;">${member.initials}</div>
                        <div class="member-name-small" style="font-size: 0.8rem; font-weight: 500;">${member.name.split(' ')[0]}${matchDisplay}</div>
                        ${member.userId === currentUser.userId ? '<div style="font-size: 0.7rem; color: #ffd966;">(You)</div>' : ''}
                    </div>
                `}).join('')}
            </div>
            
            <div style="margin-top: 30px;">
                <button onclick="window.location.href='itinerary.html'" class="custom-trip-link" id="customTripBtn" style="display: inline-block; width: 100%; padding: 15px; background: linear-gradient(135deg, #3498db, #2ecc71); color: white; border-radius: 10px; text-decoration: none; font-weight: 600; text-align: center; border: none; cursor: pointer;">
                    <i class="fas fa-map-marked-alt"></i> Get Your Customized Trip
                </button>
            </div>
        </div>
    `;
    
    matchesContainer.style.display = 'block';
    if (noMatchesMessage) noMatchesMessage.style.display = 'none';
    
    const leaveGroupBtn = document.getElementById('leaveGroupBtn');
    if (leaveGroupBtn) {
        leaveGroupBtn.addEventListener('click', async function() {
            if (confirm('Are you sure you want to leave this group?')) {
                await leaveGroup(currentGroupId);
            }
        });
    }
}

async function findUserInDatabase() {
    try {
        console.log('📡 Fetching all users from database...');
        
        const response = await fetch(`${API_BASE_URL}/preferences/debug/all`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        
        const data = await response.json();
        const allUsers = data.data || [];
        
        const matchingUser = allUsers.find(u => 
            u.user_id === loginUsername || 
            u.user_id.startsWith(loginUsername) || 
            u.user_id.includes(loginUsername) ||
            (userEmail && u.user_id === userEmail.split('@')[0])
        );
        
        if (!matchingUser) {
            console.log('❌ No matching user found');
            showNoUserMessage();
            return false;
        }
        
        let interests = [];
        if (matchingUser.interests) {
            if (Array.isArray(matchingUser.interests)) {
                interests = matchingUser.interests;
            } else if (typeof matchingUser.interests === 'string') {
                try {
                    interests = JSON.parse(matchingUser.interests);
                } catch (e) {
                    interests = matchingUser.interests.split(',').map(i => i.trim());
                }
            }
        }
        
        const nameParts = matchingUser.user_id.split('_');
        const formattedName = nameParts
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        
        currentUser = {
            userId: matchingUser.user_id,
            name: formattedName,
            initials: getInitials(formattedName),
            interests: interests,
            destination: matchingUser.destination || '',
            startDate: matchingUser.start_date || '',
            endDate: matchingUser.end_date || '',
            budgetMin: matchingUser.budget_min || 0,
            budgetMax: matchingUser.budget_max || 0,
            travelersCount: matchingUser.travelers_count || 0,
            companionType: matchingUser.companion_type || 'buddy'
        };
        
        console.log('✅ Current user loaded:', currentUser);
        return true;
        
    } catch (error) {
        console.error('Error finding user:', error);
        showErrorMessage(error.message);
        return false;
    }
}

function getInitials(name) {
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function showNoUserMessage() {
    if (noMatchesMessage) {
        noMatchesMessage.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <h3>User Not Found</h3>
            <p>No travel preferences found for "${loginUsername}".</p>
            <button onclick="window.location.href='preferences.html'" class="cta-button">
                Set Preferences
            </button>
        `;
    }
}

function showErrorMessage(message) {
    if (noMatchesMessage) {
        noMatchesMessage.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error</h3>
            <p>${message}</p>
        `;
    }
}

function updateUserProfileUI() {
    if (userProfileName) userProfileName.textContent = currentUser.name;
    if (userProfilePic) userProfilePic.textContent = currentUser.initials;
    if (profileLocation) {
        profileLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${currentUser.destination || 'Not set'}`;
    }
    
    if (profileInterests) {
        profileInterests.innerHTML = '';
        if (currentUser.interests && currentUser.interests.length > 0) {
            currentUser.interests.forEach(interest => {
                const tag = document.createElement('span');
                tag.className = 'interest-tag';
                tag.textContent = interest.charAt(0).toUpperCase() + interest.slice(1);
                profileInterests.appendChild(tag);
            });
        } else {
            profileInterests.innerHTML = '<span class="interest-tag">No interests</span>';
        }
    }
}

function setupFindBuddiesButton() {
    if (!findBuddiesBtn) return;
    
    findBuddiesBtn.addEventListener('click', async function() {
        if (!currentUser) {
            alert('User data not loaded');
            return;
        }
        
        if (activeGroups.length > 0) {
            alert(`You already have ${activeGroups.length} active trip(s). Please leave your current group(s) before searching for a new trip.`);
            return;
        }
        
        if (!currentUser.interests || currentUser.interests.length === 0) {
            alert('Your profile has no interests. Please update your preferences.');
            return;
        }
        
        if (!currentUser.destination) {
            alert('Please set your destination in preferences first.');
            return;
        }
        
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding Group...';
        this.disabled = true;
        
        try {
            await findGroup();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            this.innerHTML = '<i class="fas fa-search"></i> Find Your Travel Group';
            this.disabled = false;
        }
    });
}

window.addEventListener('click', (e) => {
    if (e.target === groupModal) {
        groupModal.style.display = 'none';
    }
});