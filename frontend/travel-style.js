// ============================================
// TRAVEL STYLE JS - COMPLETELY FIXED VERSION
// ============================================

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Debug logging
console.log('='.repeat(50));
console.log('🚀 TRAVEL STYLE PAGE LOADED - FIXED VERSION');
console.log('='.repeat(50));

// DOM Elements
const interestOptions = document.querySelectorAll('.interest-option');
const selectedCountElement = document.getElementById('selected-count');
const progressBar = document.getElementById('progressBar');
const companionOptions = document.querySelectorAll('.companion-option');
const instructionMessage = document.getElementById('instruction-message');
const successMessage = document.getElementById('success-message');

// State - MAKE SURE THIS IS INITIALIZED AS EMPTY ARRAY
let selectedInterests = [];
let selectedCompanion = null;
let companionEnabled = false;

// Initialize
updateProgress();
disableCompanionOptions();

// ============================================
// HELPER: Get User ID
// ============================================
function getUserId() {
    try {
        // Try multiple sources
        const userData = localStorage.getItem('user') || localStorage.getItem('userData');
        
        if (userData) {
            const user = JSON.parse(userData);
            return user.user_id || user.id || user.userId;
        }
        
        // Check for direct user_id
        const directUserId = localStorage.getItem('user_id');
        if (directUserId) return directUserId;
        
        // Check session storage
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
            const user = JSON.parse(sessionUser);
            return user.user_id || user.id || user.userId;
        }
        
    } catch (e) {
        console.error('Error getting user ID:', e);
    }
    return null;
}

// ============================================
// FIXED: Interest Selection Handler
// ============================================
interestOptions.forEach(option => {
    option.addEventListener('click', function(e) {
        e.preventDefault();
        
        const interest = this.getAttribute('data-interest');
        console.log('Clicked interest:', interest);
        console.log('Current selectedInterests:', selectedInterests);
        
        // Check if this interest is already selected
        const index = selectedInterests.indexOf(interest);
        
        if (index > -1) {
            // REMOVE interest (deselect)
            console.log('Removing interest:', interest);
            selectedInterests.splice(index, 1);
            this.classList.remove('selected');
        } else {
            // ADD interest (select)
            if (selectedInterests.length < 5) {
                console.log('Adding interest:', interest);
                selectedInterests.push(interest);
                this.classList.add('selected');
            } else {
                // Already have 5 interests
                alert('You can only select 5 interests. Please deselect one first.');
                console.log('Cannot add - already have 5 interests');
                return;
            }
        }
        
        // Update UI
        updateProgress();
        
        // Enable/disable companion options based on count
        if (selectedInterests.length === 5) {
            console.log('✅ Exactly 5 interests selected! Enabling companion options');
            enableCompanionOptions();
        } else {
            console.log(`⏳ Selected ${selectedInterests.length}/5 interests`);
            disableCompanionOptions();
        }
        
        // Log current selection for debugging
        console.log('Updated selectedInterests:', selectedInterests);
    });
});

// ============================================
// UPDATE PROGRESS BAR
// ============================================
function updateProgress() {
    const count = selectedInterests.length;
    const percentage = (count / 5) * 100;
    
    if (selectedCountElement) {
        selectedCountElement.textContent = count;
    }
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
}

// ============================================
// ENABLE COMPANION OPTIONS
// ============================================
function enableCompanionOptions() {
    companionEnabled = true;
    
    companionOptions.forEach(option => {
        option.classList.remove('disabled');
        option.classList.add('enabled');
        
        const lockIcon = option.querySelector('.lock-icon');
        if (lockIcon) {
            lockIcon.style.display = 'none';
        }
        
        const statusIndicator = option.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.classList.add('active');
        }
    });
    
    if (instructionMessage) {
        instructionMessage.classList.add('hidden');
    }
    
    if (successMessage) {
        successMessage.classList.remove('hidden');
    }
}

// ============================================
// DISABLE COMPANION OPTIONS
// ============================================
function disableCompanionOptions() {
    companionEnabled = false;
    
    companionOptions.forEach(option => {
        option.classList.add('disabled');
        option.classList.remove('enabled');
        option.classList.remove('selected');
        
        const lockIcon = option.querySelector('.lock-icon');
        if (lockIcon) {
            lockIcon.style.display = 'block';
        }
        
        const statusIndicator = option.querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.classList.remove('active');
        }
    });
    
    if (instructionMessage) {
        instructionMessage.classList.remove('hidden');
    }
    
    if (successMessage) {
        successMessage.classList.add('hidden');
    }
}

// ============================================
// Calculate Duration Days
// ============================================
function calculateDurationDays(startDateStr, endDateStr) {
    try {
        if (!startDateStr || !endDateStr) return null;
        
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        const timeDiff = endDate.getTime() - startDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        return daysDiff >= 0 ? daysDiff + 1 : null;
    } catch (error) {
        console.error('Error calculating duration:', error);
        return null;
    }
}

// ============================================
// Get Complete Travel Data
// ============================================
function getCompleteTravelData() {
    // Get data from all sources
    const searchParams = JSON.parse(sessionStorage.getItem('lastSearchParams') || '{}');
    const pendingPrefs = JSON.parse(localStorage.getItem('pending_travel_prefs') || '{}');
    
    console.log('📋 Data Sources:', { searchParams, pendingPrefs });
    
    // Get duration
    let duration_days = null;
    
    if (searchParams.durationDays) {
        duration_days = parseInt(searchParams.durationDays);
    } else if (pendingPrefs.duration_days) {
        duration_days = parseInt(pendingPrefs.duration_days);
    } else {
        const start_date = searchParams.startDate || pendingPrefs.start_date;
        const end_date = searchParams.endDate || pendingPrefs.end_date;
        if (start_date && end_date) {
            duration_days = calculateDurationDays(start_date, end_date);
        }
    }
    
    return {
        destination: searchParams.destination || pendingPrefs.destination || '',
        start_date: searchParams.startDate || pendingPrefs.start_date || '',
        end_date: searchParams.endDate || pendingPrefs.end_date || '',
        duration_days: duration_days,
        budget_min: parseInt(searchParams.budgetMin || pendingPrefs.budget_min) || null,
        budget_max: parseInt(searchParams.budgetMax || pendingPrefs.budget_max) || null,
        travelers_count: parseInt(searchParams.travellers || pendingPrefs.travelers_count) || null
    };
}

// ============================================
// MAIN FIXED FUNCTION: Save Preferences
// ============================================
async function savePreferencesToBackend(interests, companion_type) {
    console.log('='.repeat(50));
    console.log('💾 SAVING PREFERENCES');
    console.log('='.repeat(50));
    console.log('Interests to save:', interests);
    console.log('Interests count:', interests.length);
    
    const user_id = getUserId();
    
    if (!user_id) {
        alert('Please login first');
        window.location.href = 'login.html';
        return { success: false, message: 'Not logged in' };
    }
    
    // Get travel data
    const travelData = getCompleteTravelData();
    
    // CRITICAL: Make sure we have exactly 5 interests
    if (!Array.isArray(interests) || interests.length !== 5) {
        console.error('❌ Invalid interests array:', interests);
        alert('Please select exactly 5 interests');
        throw new Error('Invalid interests count');
    }
    
    // Create payload
    const preferenceData = {
        user_id: user_id,
        destination: travelData.destination || null,
        start_date: travelData.start_date || null,
        end_date: travelData.end_date || null,
        duration_days: travelData.duration_days,
        budget_min: travelData.budget_min,
        budget_max: travelData.budget_max,
        travelers_count: travelData.travelers_count,
        interests: interests,  // Send as array
        companion_type: companion_type
    };
    
    console.log('📤 Sending payload:', JSON.stringify(preferenceData, null, 2));
    
    try {
        const response = await fetch(`${API_BASE_URL}/preferences/save`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(preferenceData)
        });
        
        const result = await response.json();
        console.log('📥 Server response:', result);
        
        if (result.success) {
            console.log('✅ Preferences saved successfully!');
            console.log('   - Interests saved:', interests);
            
            // Clear temporary data
            localStorage.removeItem('pending_travel_prefs');
            
            return result;
        } else {
            throw new Error(result.message || 'Failed to save');
        }
    } catch (error) {
        console.error('❌ Error saving:', error);
        throw error;
    }
}

// ============================================
// HANDLE COMPANION SELECTION
// ============================================
companionOptions.forEach(option => {
    option.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const companionType = this.getAttribute('data-companion');
        
        // Validate interests count
        if (selectedInterests.length !== 5) {
            alert(`Please select exactly 5 interests. Currently selected: ${selectedInterests.length}`);
            return;
        }
        
        if (!companionEnabled) {
            alert('Please select 5 interests first');
            return;
        }

        try {
            // Show loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            this.style.pointerEvents = 'none';
            
            // Save to backend
            const result = await savePreferencesToBackend(selectedInterests, companionType);
            
            if (result && result.success) {
                // Update UI
                companionOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                
                // Show success
                alert('Preferences saved successfully! Redirecting...');
                
                // Redirect
                setTimeout(() => {
                    if (companionType === 'self-group') {
                        window.location.href = 'self.html';
                    } else {
                        window.location.href = 'travelBuddyhtml.html';
                    }
                }, 1000);
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to save preferences. Please try again.');
            
            // Reset button
            this.innerHTML = originalText;
            this.style.pointerEvents = 'auto';
        }
    });
});

// ============================================
// RESET FUNCTION (if needed)
// ============================================
function resetSelections() {
    selectedInterests = [];
    selectedCompanion = null;
    
    // Remove selected class from all interests
    interestOptions.forEach(option => {
        option.classList.remove('selected');
    });
    
    updateProgress();
    disableCompanionOptions();
    
    console.log('Selections reset');
}

// ============================================
// WINDOW LOAD EVENT
// ============================================
window.addEventListener('load', function() {
    console.log('🏁 Page loaded');
    
    // Check login
    const user_id = getUserId();
    if (!user_id) {
        console.log('No user logged in');
        // Uncomment if you want to redirect
        // window.location.href = 'login.html';
    } else {
        console.log('User logged in:', user_id);
    }
    
    // Log stored data
    console.log('SessionStorage:', {
        lastSearchParams: sessionStorage.getItem('lastSearchParams')
    });
    
    console.log('LocalStorage:', {
        user: localStorage.getItem('user'),
        pending_travel_prefs: localStorage.getItem('pending_travel_prefs')
    });
});

// Expose reset function globally (for debugging)
window.resetSelections = resetSelections;